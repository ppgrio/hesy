from flask import Blueprint, jsonify, request
from models.init import db
from models.sesiones import Sesiones
from models.pacientes import Pacientes
from models.accesos import Accesos
from models.filtros import Filtros
from models.medicamentos_sesion import MedicamentosSesion
from models.inventario import Inventario
from sqlalchemy import func
from sqlalchemy.orm import joinedload, aliased
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
from utils import normalizar_cadena, col_sin_acentos

sesion_bp = Blueprint('sesion', __name__)

def sesion_to_dict(s):
    filtro_estado = s.filtro.estado if s.filtro else (s.paciente.filtro.estado if s.paciente and s.paciente.filtro else None)
    acceso_tipo = s.acceso.tipo if s.acceso else (s.paciente.acceso.tipo if s.paciente and s.paciente.acceso else None)
    filtro_obj = s.filtro or (s.paciente.filtro if s.paciente else None)
    return {
        'id': s.id,
        'paciente_id': s.paciente_id,
        'paciente_nombre': s.paciente.nombre if s.paciente else None,
        'paciente_no_expediente': s.paciente.no_expediente if s.paciente else None,
        'acceso': acceso_tipo,
        'filtro': filtro_estado,
        'precio': float(filtro_obj.precio) if filtro_obj and filtro_obj.precio is not None else None,
        'fecha_hora': s.fecha_hora.isoformat() if s.fecha_hora else None,
        'pagado': bool(s.pagado),
    }

def _aplicar_rango(query, desde, hasta):
    if desde:
        try:
            query = query.filter(Sesiones.fecha_hora >= datetime.fromisoformat(desde))
        except ValueError:
            raise ValueError('formato de desde inválido')
    if hasta:
        try:
            query = query.filter(Sesiones.fecha_hora < datetime.fromisoformat(hasta) + timedelta(days=1))
        except ValueError:
            raise ValueError('formato de hasta inválido')
    return query


def _adjuntar_medicamentos(sesiones):
    usos = MedicamentosSesion.query.options(
        joinedload(MedicamentosSesion.inventario_item)
    ).filter(MedicamentosSesion.sesion_id.in_([s.id for s in sesiones])).all()
    por_sesion = {}
    for u in usos:
        por_sesion.setdefault(u.sesion_id, []).append({
            'id': u.id,
            'nombre': u.inventario_item.nombre if u.inventario_item else None,
            'cantidad': u.cantidad_usada,
            'precio': float(u.inventario_item.precio) if u.inventario_item and u.inventario_item.precio is not None else None,
        })
    data = [sesion_to_dict(s) for s in sesiones]
    for d in data:
        d['medicamentos'] = por_sesion.get(d['id'], [])
    return data


def _cargar_con_relaciones(ids):
    query = Sesiones.query.options(
        joinedload(Sesiones.paciente).joinedload(Pacientes.acceso),
        joinedload(Sesiones.paciente).joinedload(Pacientes.filtro),
        joinedload(Sesiones.acceso),
        joinedload(Sesiones.filtro)
    ).filter(Sesiones.id.in_(ids))
    sesiones = query.all()
    orden = {sid: i for i, sid in enumerate(ids)}
    sesiones.sort(key=lambda s: orden[s.id])
    return sesiones


@sesion_bp.route('/api/session')
def get_sessions():
    try:
        base = _aplicar_rango(Sesiones.query, request.args.get('desde'), request.args.get('hasta'))
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    if 'page' not in request.args:
        query = base.options(
            joinedload(Sesiones.paciente).joinedload(Pacientes.acceso),
            joinedload(Sesiones.paciente).joinedload(Pacientes.filtro),
            joinedload(Sesiones.acceso),
            joinedload(Sesiones.filtro)
        )
        sesiones = query.order_by(Sesiones.fecha_hora.desc()).all()
        return jsonify(_adjuntar_medicamentos(sesiones))

    page = max(request.args.get('page', 1, type=int), 1)
    page_size = min(max(request.args.get('page_size', 20, type=int), 1), 1000)

    SF = aliased(Filtros)
    PF = aliased(Filtros)
    q = base.join(Pacientes, Sesiones.paciente_id == Pacientes.id)
    q = q.outerjoin(SF, Sesiones.filtro_sesion == SF.id)
    q = q.outerjoin(PF, Pacientes.filtro_id == PF.id)

    filtro_efectivo = func.coalesce(SF.estado, PF.estado)
    precio_efectivo = func.coalesce(SF.precio, PF.precio)

    nombre = request.args.get('paciente_nombre', '').strip()
    if nombre:
        q = q.filter(col_sin_acentos(Pacientes.nombre).ilike(f'%{normalizar_cadena(nombre)}%'))

    expediente = request.args.get('paciente_no_expediente', '').strip()
    if expediente:
        try:
            q = q.filter(Pacientes.no_expediente == int(expediente))
        except ValueError:
            pass

    filtro_txt = request.args.get('filtro', '').strip()
    if filtro_txt:
        q = q.filter(func.lower(filtro_efectivo).like(f'%{normalizar_cadena(filtro_txt).lower()}%'))

    precio = request.args.get('precio', '').strip()
    if precio:
        try:
            q = q.filter(precio_efectivo == float(precio))
        except ValueError:
            pass

    hora = request.args.get('hora', '').strip()
    if hora:
        q = q.filter(func.to_char(Sesiones.fecha_hora, 'HH24:MI').like(f'%{hora}%'))

    estado = request.args.get('estado', '').strip()
    if estado:
        n = normalizar_cadena(estado.lower())
        if n.startswith('pagad'):
            q = q.filter(Sesiones.pagado.is_(True))
        elif n.startswith('pend'):
            q = q.filter(Sesiones.pagado.is_(False))

    sort = request.args.get('sort', 'hora')
    dir_ = 'desc' if request.args.get('dir', 'asc') == 'desc' else 'asc'
    sort_map = {
        'hora': Sesiones.fecha_hora,
        'paciente_nombre': Pacientes.nombre,
        'paciente_no_expediente': Pacientes.no_expediente,
        'filtro': filtro_efectivo,
        'precio': precio_efectivo,
        'estado': Sesiones.pagado,
    }
    sort_col = sort_map.get(sort, Sesiones.fecha_hora)
    q = q.order_by(sort_col.desc() if dir_ == 'desc' else sort_col.asc(), Sesiones.id.desc())

    total = q.count()
    ids = [
        row[0]
        for row in q.with_entities(Sesiones.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
    ]

    return jsonify({
        'items': _adjuntar_medicamentos(_cargar_con_relaciones(ids)),
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size,
    })

@sesion_bp.route('/api/session', methods=['POST'])
def create_session():
    data = request.get_json()
    paciente_id = data.get('paciente_id')
    fecha_hora_str = data.get('fecha_hora')
    tipo_de_filtro = data.get('filtro')
    tipo_de_acceso = data.get('acceso')

    if not paciente_id or not fecha_hora_str:
        return jsonify({'error': 'paciente_id y fecha_hora son obligatorios'}), 400

    paciente = Pacientes.query.get(paciente_id)
    if not paciente:
        return jsonify({'error': 'Paciente no encontrado'}), 404

    from datetime import datetime
    try:
        fecha_hora = datetime.fromisoformat(fecha_hora_str)
    except ValueError:
        return jsonify({'error': 'Formato de fecha_hora inválido'}), 400

    filtro_id = paciente.filtro_id
    if tipo_de_filtro:
        filtro = Filtros.query.filter_by(estado=tipo_de_filtro).first()
        if not filtro:
            return jsonify({'error': f'Filtro "{tipo_de_filtro}" no válido'}), 400
        filtro_id = filtro.id

    acceso_id = paciente.acceso_id
    if tipo_de_acceso:
        acceso = Accesos.query.filter_by(tipo=tipo_de_acceso).first()
        if not acceso:
            return jsonify({'error': f'Acceso "{tipo_de_acceso}" no válido'}), 400
        acceso_id = acceso.id

    pagado = data.get('pagado')
    if pagado is not None and not isinstance(pagado, bool):
        return jsonify({'error': 'pagado debe ser un booleano'}), 400

    sesion = Sesiones(
        paciente_id=paciente_id,
        fecha_hora=fecha_hora,
        filtro_sesion=filtro_id,
        acceso_sesion=acceso_id,
        pagado=bool(pagado) if pagado is not None else False,
    )
    db.session.add(sesion)
    db.session.commit()

    return jsonify(sesion_to_dict(sesion)), 201

@sesion_bp.route('/api/session/<int:id>', methods=['PUT'])
def update_session(id):
    sesion = Sesiones.query.options(
        joinedload(Sesiones.paciente).joinedload(Pacientes.acceso),
        joinedload(Sesiones.paciente).joinedload(Pacientes.filtro),
        joinedload(Sesiones.acceso),
        joinedload(Sesiones.filtro)
    ).get_or_404(id)
    data = request.get_json()

    paciente_id = data.get('paciente_id')
    if paciente_id:
        paciente = Pacientes.query.get(paciente_id)
        if not paciente:
            return jsonify({'error': 'Paciente no encontrado'}), 404
        sesion.paciente_id = paciente_id

    fecha_hora_str = data.get('fecha_hora')
    if fecha_hora_str:
        try:
            sesion.fecha_hora = datetime.fromisoformat(fecha_hora_str)
        except ValueError:
            return jsonify({'error': 'Formato de fecha_hora inválido'}), 400

    tipo_de_filtro = data.get('filtro')
    if tipo_de_filtro is not None:
        if tipo_de_filtro == '':
            sesion.filtro_sesion = None
        else:
            filtro = Filtros.query.filter_by(estado=tipo_de_filtro).first()
            if not filtro:
                return jsonify({'error': f'Filtro "{tipo_de_filtro}" no válido'}), 400
            sesion.filtro_sesion = filtro.id

    tipo_de_acceso = data.get('acceso')
    if tipo_de_acceso is not None:
        if tipo_de_acceso == '':
            sesion.acceso_sesion = None
        else:
            acceso = Accesos.query.filter_by(tipo=tipo_de_acceso).first()
            if not acceso:
                return jsonify({'error': f'Acceso "{tipo_de_acceso}" no válido'}), 400
            sesion.acceso_sesion = acceso.id

    if 'pagado' in data:
        if not isinstance(data['pagado'], bool):
            return jsonify({'error': 'pagado debe ser un booleano'}), 400
        sesion.pagado = data['pagado']

    db.session.commit()
    return jsonify(sesion_to_dict(sesion))


@sesion_bp.route('/api/session/<int:id>', methods=['DELETE'])
def delete_session(id):
    sesion = Sesiones.query.get_or_404(id)
    db.session.delete(sesion)
    db.session.commit()
    return jsonify({'success': True})

@sesion_bp.route('/api/session/<int:sesion_id>/medicamentos')
def get_medicamentos_sesion(sesion_id):
    Sesiones.query.get_or_404(sesion_id)
    usos = MedicamentosSesion.query.options(
        joinedload(MedicamentosSesion.inventario_item),
    ).filter_by(sesion_id=sesion_id).all()
    return jsonify([{
        'id': u.id,
        'inventario_id': u.inventario_id,
        'nombre': u.inventario_item.nombre if u.inventario_item else None,
        'cantidad_usada': u.cantidad_usada,
        'precio': float(u.inventario_item.precio) if u.inventario_item and u.inventario_item.precio is not None else None,
        'stock_disponible': u.inventario_item.cantidad if u.inventario_item else 0,
    } for u in usos])

@sesion_bp.route('/api/session/<int:sesion_id>/medicamentos', methods=['POST'])
def add_medicamento_sesion(sesion_id):
    Sesiones.query.get_or_404(sesion_id)
    data = request.get_json()
    inventario_id = data.get('inventario_id')
    cantidad = data.get('cantidad_usada')

    if not inventario_id or not cantidad or cantidad < 1:
        return jsonify({'error': 'inventario_id y cantidad_usada (>= 1) son obligatorios'}), 400

    inventario = Inventario.query.get(inventario_id)
    if not inventario:
        return jsonify({'error': 'Medicamento no encontrado en inventario'}), 404

    if inventario.cantidad < cantidad:
        return jsonify({
            'error': f'Stock insuficiente de {inventario.nombre}. Disponible: {inventario.cantidad}'
        }), 400

    uso = MedicamentosSesion.query.filter_by(
        sesion_id=sesion_id,
        inventario_id=inventario_id,
    ).first()
    if uso:
        uso.cantidad_usada += cantidad
    else:
        uso = MedicamentosSesion(sesion_id=sesion_id, inventario_id=inventario_id, cantidad_usada=cantidad)
        db.session.add(uso)
    inventario.cantidad -= cantidad

    try:
        db.session.commit()
        return jsonify({
            'id': uso.id,
            'inventario_id': uso.inventario_id,
            'nombre': uso.inventario_item.nombre if uso.inventario_item else None,
            'cantidad_usada': uso.cantidad_usada,
            'precio': float(uso.inventario_item.precio) if uso.inventario_item and uso.inventario_item.precio is not None else None,
            'stock_disponible': uso.inventario_item.cantidad if uso.inventario_item else 0,
        }), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Error al descontar stock. Intente de nuevo.'}), 409

@sesion_bp.route('/api/medicamento-sesion/<int:id>', methods=['DELETE'])
def delete_medicamento_sesion(id):
    uso = MedicamentosSesion.query.get_or_404(id)
    inventario = uso.inventario_item
    if inventario:
        inventario.cantidad += uso.cantidad_usada
    db.session.delete(uso)
    db.session.commit()
    return jsonify({'success': True})
