from flask import Blueprint, jsonify, request
from models.init import db
from models.sesiones import Sesiones
from models.pacientes import Pacientes
from models.medicamentos_sesion import MedicamentosSesion
from models.inventario import Inventario
from sqlalchemy.exc import IntegrityError

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

@sesion_bp.route('/api/session/<int:sesion_id>/medicamentos')
def get_medicamentos_sesion(sesion_id):
    Sesiones.query.get_or_404(sesion_id)
    usos = MedicamentosSesion.query.filter_by(sesion_id=sesion_id).all()
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
