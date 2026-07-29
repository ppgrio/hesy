from flask import Blueprint, jsonify, request
from models.init import db
from models.sesiones import Sesiones
from models.pacientes import Pacientes

sesion_bp = Blueprint('sesion', __name__)

@sesion_bp.route('/api/session')
def get_sessions():
    sesiones = Sesiones.query.all()
    return jsonify([{
        'id': s.id,
        'paciente_id': s.paciente_id,
        'paciente_nombre': s.paciente.nombre if s.paciente else None,
        'acceso': s.paciente.acceso.tipo if s.paciente and s.paciente.acceso else None,
        'filtro': s.paciente.filtro.estado if s.paciente and s.paciente.filtro else None,
        'fecha_hora': s.fecha_hora.isoformat() if s.fecha_hora else None,
    } for s in sesiones])

@sesion_bp.route('/api/session', methods=['POST'])
def create_session():
    data = request.get_json()
    paciente_id = data.get('paciente_id')
    fecha_hora_str = data.get('fecha_hora')

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

    sesion = Sesiones(paciente_id=paciente_id, fecha_hora=fecha_hora)
    db.session.add(sesion)
    db.session.commit()

    return jsonify({
        'id': sesion.id,
        'paciente_id': sesion.paciente_id,
        'paciente_nombre': sesion.paciente.nombre if sesion.paciente else None,
        'acceso': sesion.paciente.acceso.tipo if sesion.paciente and sesion.paciente.acceso else None,
        'filtro': sesion.paciente.filtro.estado if sesion.paciente and sesion.paciente.filtro else None,
        'fecha_hora': sesion.fecha_hora.isoformat() if sesion.fecha_hora else None,
    }), 201

@sesion_bp.route('/api/session/<int:id>', methods=['DELETE'])
def delete_session(id):
    sesion = Sesiones.query.get_or_404(id)
    db.session.delete(sesion)
    db.session.commit()
    return jsonify({'success': True})
