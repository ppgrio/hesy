from flask import Blueprint, jsonify, request
from models.init import db
from models.sesiones import Sesiones
from models.pacientes import Pacientes
from models.accesos import Accesos
from models.filtros import Filtros
from models.medicamentos_sesion import MedicamentosSesion
from models.inventario import Inventario
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta

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
    }

@sesion_bp.route('/api/session')
def get_sessions():
    desde = request.args.get('desde')
    hasta = request.args.get('hasta')

    query = Sesiones.query.options(
        joinedload(Sesiones.paciente).joinedload(Pacientes.acceso),
        joinedload(Sesiones.paciente).joinedload(Pacientes.filtro),
        joinedload(Sesiones.acceso),
        joinedload(Sesiones.filtro)
    )

    if desde:
        try:
            query = query.filter(Sesiones.fecha_hora >= datetime.fromisoformat(desde))
        except ValueError:
            return jsonify({'error': 'formato de desde inválido'}), 400

    if hasta:
        try:
            query = query.filter(Sesiones.fecha_hora < datetime.fromisoformat(hasta) + timedelta(days=1))
        except ValueError:
            return jsonify({'error': 'formato de hasta inválido'}), 400

    sesiones = query.order_by(Sesiones.fecha_hora.desc()).all()

    usos = MedicamentosSesion.query.options(
        joinedload(MedicamentosSesion.inventario_item)
    ).filter(MedicamentosSesion.sesion_id.in_([s.id for s in sesiones])).all()
    por_sesion = {}
    for u in usos:
        por_sesion.setdefault(u.sesion_id, []).append({
            'nombre': u.inventario_item.nombre if u.inventario_item else None,
            'cantidad': u.cantidad_usada,
        })

    data = [sesion_to_dict(s) for s in sesiones]
    for d in data:
        d['medicamentos'] = por_sesion.get(d['id'], [])
    return jsonify(data)

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

    sesion = Sesiones(
        paciente_id=paciente_id,
        fecha_hora=fecha_hora,
        filtro_sesion=filtro_id,
        acceso_sesion=acceso_id,
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

    uso = MedicamentosSesion(sesion_id=sesion_id, inventario_id=inventario_id, cantidad_usada=cantidad)
    inventario.cantidad -= cantidad
    db.session.add(uso)

    try:
        db.session.commit()
        return jsonify({
            'id': uso.id,
            'inventario_id': uso.inventario_id,
            'nombre': uso.inventario_item.nombre if uso.inventario_item else None,
            'cantidad_usada': uso.cantidad_usada,
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
