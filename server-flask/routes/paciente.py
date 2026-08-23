from flask import Blueprint, request, jsonify
from models.init import db
from models.pacientes import Pacientes
from models.doctores import Doctores
from models.accesos import Accesos
from models.filtros import Filtros
from models.sesiones import Sesiones
from sqlalchemy.orm import joinedload
from utils import normalizar_cadena, col_sin_acentos

paciente_bp = Blueprint('paciente', __name__)


def paciente_to_dict(p):
    return {
        'id': p.id,
        'no_expediente': p.no_expediente,
        'nombre': p.nombre,
        'fecha_nacimiento': p.fecha_nacimiento.isoformat() if p.fecha_nacimiento else None,
        'hierros': p.hierros,
        'eritropoyetina': p.eritropoyetina,
        'usos_restantes': p.usos_restantes,
        'credito': p.credito,
        'observaciones': p.observaciones,
        'fecha_inicio_filtro': p.fecha_inicio_filtro.isoformat() if p.fecha_inicio_filtro else None,
        'fecha_fin_filtro': p.fecha_fin_filtro.isoformat() if p.fecha_fin_filtro else None,
        'doctor_id': p.doctor_id,
        'doctor': p.doctor.nombre if p.doctor else None,
        'acceso_id': p.acceso_id,
        'acceso': p.acceso.tipo if p.acceso else None,
        'filtro_id': p.filtro_id,
        'filtro': p.filtro.estado if p.filtro else None,
    }


@paciente_bp.route('/api/patient', methods=['GET'])
def get_patients():
    if 'page' not in request.args:
        pacientes = Pacientes.query.options(
            joinedload(Pacientes.doctor),
            joinedload(Pacientes.acceso),
            joinedload(Pacientes.filtro),
        ).all()
        return jsonify([paciente_to_dict(p) for p in pacientes])

    page = request.args.get('page', 1, type=int)
    page_size = min(max(request.args.get('page_size', 100, type=int), 1), 1000)
    dir_ = 'desc' if request.args.get('dir', 'asc') == 'desc' else 'asc'

    q = Pacientes.query.options(
        joinedload(Pacientes.doctor),
        joinedload(Pacientes.acceso),
        joinedload(Pacientes.filtro),
    )
    q = q.join(Doctores, Pacientes.doctor_id == Doctores.id, isouter=True)
    q = q.join(Accesos, Pacientes.acceso_id == Accesos.id, isouter=True)
    q = q.join(Filtros, Pacientes.filtro_id == Filtros.id, isouter=True)

    unidas = {'doctor': Doctores.nombre, 'acceso': Accesos.tipo, 'filtro': Filtros.estado}
    numericas = ('no_expediente', 'hierros', 'eritropoyetina', 'usos_restantes')
    flotantes = ('credito',)

    for key in unidas.keys() | {'no_expediente', 'nombre', 'fecha_nacimiento', 'hierros',
                                'eritropoyetina', 'usos_restantes', 'credito', 'fecha_inicio_filtro',
                                'fecha_fin_filtro', 'observaciones'}:
        v = request.args.get(key, '').strip()
        if not v:
            continue
        col = unidas.get(key) or getattr(Pacientes, key)
        if key in numericas:
            try:
                q = q.filter(col == int(v))
            except ValueError:
                pass
        elif key in flotantes:
            try:
                q = q.filter(col == float(v))
            except ValueError:
                pass
        else:
            q = q.filter(col_sin_acentos(col).ilike(f'%{normalizar_cadena(v)}%'))

    sort = request.args.get('sort', 'no_expediente')
    sort_col = unidas.get(sort) or getattr(Pacientes, sort, Pacientes.no_expediente)
    q = q.order_by(sort_col.desc() if dir_ == 'desc' else sort_col.asc())

    pag = q.paginate(page=page, per_page=page_size, error_out=False)
    return jsonify({
        'items': [paciente_to_dict(p) for p in pag.items],
        'total': pag.total,
        'page': pag.page,
        'page_size': page_size,
        'total_pages': pag.pages,
    })


@paciente_bp.route('/api/patient', methods=['POST'])
def create_patient():
    data = request.get_json()

    nombre = data.get('nombre', '').strip()
    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400
    if len(nombre) > 60:
        return jsonify({'error': 'El nombre no puede exceder 60 caracteres'}), 400

    fecha_nacimiento = data.get('fecha_nacimiento')
    if fecha_nacimiento:
        from datetime import date as dt_date
        try:
            fecha_nacimiento = dt_date.fromisoformat(fecha_nacimiento)
        except (ValueError, TypeError):
            return jsonify({'error': 'Formato de fecha de nacimiento inválido'}), 400

    hierros = data.get('hierros')
    if hierros is not None:
        try:
            hierros = int(hierros)
        except (TypeError, ValueError):
            return jsonify({'error': 'Hierros debe ser un número entero'}), 400

    eritropoyetina = data.get('eritropoyetina')
    if eritropoyetina is not None:
        try:
            eritropoyetina = int(eritropoyetina)
        except (TypeError, ValueError):
            return jsonify({'error': 'Eritropoyetina debe ser un número entero'}), 400

    usos_restantes = data.get('usos_restantes')
    if usos_restantes is not None:
        try:
            usos_restantes = int(usos_restantes)
        except (TypeError, ValueError):
            return jsonify({'error': 'Usos restantes debe ser un número entero'}), 400
        if usos_restantes < 0:
            return jsonify({'error': 'Usos restantes no puede ser negativo'}), 400

    credito = data.get('credito', 0)
    try:
        credito = float(credito)
    except (TypeError, ValueError):
        return jsonify({'error': 'El crédito debe ser un número'}), 400

    doctor_id = data.get('doctor_id')
    if doctor_id and not Doctores.query.get(doctor_id):
        return jsonify({'error': 'El doctor seleccionado no existe'}), 400

    acceso_id = data.get('acceso_id')
    if acceso_id and not Accesos.query.get(acceso_id):
        return jsonify({'error': 'El acceso seleccionado no existe'}), 400

    filtro_id = data.get('filtro_id')
    if filtro_id and not Filtros.query.get(filtro_id):
        return jsonify({'error': 'El filtro seleccionado no existe'}), 400

    fecha_inicio_filtro = data.get('fecha_inicio_filtro')
    if fecha_inicio_filtro:
        from datetime import date as dt_date
        try:
            fecha_inicio_filtro = dt_date.fromisoformat(fecha_inicio_filtro)
        except (ValueError, TypeError):
            return jsonify({'error': 'Formato de fecha de inicio de filtro inválido'}), 400

    fecha_fin_filtro = data.get('fecha_fin_filtro')
    if fecha_fin_filtro:
        from datetime import date as dt_date
        try:
            fecha_fin_filtro = dt_date.fromisoformat(fecha_fin_filtro)
        except (ValueError, TypeError):
            return jsonify({'error': 'Formato de fecha de fin de filtro inválido'}), 400

    no_expediente = data.get('no_expediente')
    if no_expediente is not None:
        try:
            no_expediente = int(no_expediente)
        except (TypeError, ValueError):
            return jsonify({'error': 'El número de expediente debe ser un número entero'}), 400
        if Pacientes.query.filter_by(no_expediente=no_expediente).first():
            return jsonify({'error': 'Ya existe un paciente con ese número de expediente'}), 409

    paciente = Pacientes(
        no_expediente=no_expediente,
        nombre=nombre,
        fecha_nacimiento=fecha_nacimiento,
        hierros=hierros,
        eritropoyetina=eritropoyetina,
        usos_restantes=usos_restantes,
        credito=credito,
        doctor_id=doctor_id,
        acceso_id=acceso_id,
        filtro_id=filtro_id,
        fecha_inicio_filtro=fecha_inicio_filtro,
        fecha_fin_filtro=fecha_fin_filtro,
        observaciones=(data.get('observaciones') or '').strip() or None,
    )
    db.session.add(paciente)
    db.session.commit()

    return jsonify(paciente_to_dict(paciente)), 201


@paciente_bp.route('/api/patient/<int:id>', methods=['PUT'])
def update_patient(id):
    paciente = Pacientes.query.get_or_404(id)
    data = request.get_json()

    nombre = data.get('nombre', '').strip()
    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400
    if len(nombre) > 60:
        return jsonify({'error': 'El nombre no puede exceder 60 caracteres'}), 400

    fecha_nacimiento = data.get('fecha_nacimiento')
    if fecha_nacimiento:
        from datetime import date as dt_date
        try:
            fecha_nacimiento = dt_date.fromisoformat(fecha_nacimiento)
        except (ValueError, TypeError):
            return jsonify({'error': 'Formato de fecha de nacimiento inválido'}), 400
    else:
        fecha_nacimiento = None

    hierros = data.get('hierros')
    if hierros is not None:
        try:
            hierros = int(hierros)
        except (TypeError, ValueError):
            return jsonify({'error': 'Hierros debe ser un número entero'}), 400

    eritropoyetina = data.get('eritropoyetina')
    if eritropoyetina is not None:
        try:
            eritropoyetina = int(eritropoyetina)
        except (TypeError, ValueError):
            return jsonify({'error': 'Eritropoyetina debe ser un número entero'}), 400

    usos_restantes = data.get('usos_restantes')
    if usos_restantes is not None:
        try:
            usos_restantes = int(usos_restantes)
        except (TypeError, ValueError):
            return jsonify({'error': 'Usos restantes debe ser un número entero'}), 400
        if usos_restantes < 0:
            return jsonify({'error': 'Usos restantes no puede ser negativo'}), 400

    credito = data.get('credito', 0)
    try:
        credito = float(credito)
    except (TypeError, ValueError):
        return jsonify({'error': 'El crédito debe ser un número'}), 400

    doctor_id = data.get('doctor_id')
    if doctor_id and not Doctores.query.get(doctor_id):
        return jsonify({'error': 'El doctor seleccionado no existe'}), 400

    acceso_id = data.get('acceso_id')
    if acceso_id and not Accesos.query.get(acceso_id):
        return jsonify({'error': 'El acceso seleccionado no existe'}), 400

    filtro_id = data.get('filtro_id')
    if filtro_id and not Filtros.query.get(filtro_id):
        return jsonify({'error': 'El filtro seleccionado no existe'}), 400

    fecha_inicio_filtro = data.get('fecha_inicio_filtro')
    if fecha_inicio_filtro:
        from datetime import date as dt_date
        try:
            fecha_inicio_filtro = dt_date.fromisoformat(fecha_inicio_filtro)
        except (ValueError, TypeError):
            return jsonify({'error': 'Formato de fecha de inicio de filtro inválido'}), 400
    else:
        fecha_inicio_filtro = None

    fecha_fin_filtro = data.get('fecha_fin_filtro')
    if fecha_fin_filtro:
        from datetime import date as dt_date
        try:
            fecha_fin_filtro = dt_date.fromisoformat(fecha_fin_filtro)
        except (ValueError, TypeError):
            return jsonify({'error': 'Formato de fecha de fin de filtro inválido'}), 400
    else:
        fecha_fin_filtro = None

    no_expediente = data.get('no_expediente')
    if no_expediente is not None:
        try:
            no_expediente = int(no_expediente)
        except (TypeError, ValueError):
            return jsonify({'error': 'El número de expediente debe ser un número entero'}), 400
        existente = Pacientes.query.filter_by(no_expediente=no_expediente).first()
        if existente and existente.id != id:
            return jsonify({'error': 'Ya existe un paciente con ese número de expediente'}), 409

    paciente.no_expediente = no_expediente
    paciente.nombre = nombre
    paciente.fecha_nacimiento = fecha_nacimiento
    paciente.hierros = hierros
    paciente.eritropoyetina = eritropoyetina
    paciente.usos_restantes = usos_restantes
    paciente.credito = credito
    paciente.doctor_id = doctor_id
    paciente.acceso_id = acceso_id
    paciente.filtro_id = filtro_id
    paciente.fecha_inicio_filtro = fecha_inicio_filtro
    paciente.fecha_fin_filtro = fecha_fin_filtro
    paciente.observaciones = (data.get('observaciones') or '').strip() or None

    db.session.commit()
    return jsonify(paciente_to_dict(paciente))


@paciente_bp.route('/api/patient/<int:id>', methods=['DELETE'])
def delete_patient(id):
    paciente = Pacientes.query.get_or_404(id)
    sesiones_count = Sesiones.query.filter_by(paciente_id=id).count()
    if sesiones_count > 0:
        return jsonify({'error': f'No se puede eliminar, el paciente tiene {sesiones_count} sesión(es).'}), 409
    db.session.delete(paciente)
    db.session.commit()
    return jsonify({'success': True})
