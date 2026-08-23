from flask import Blueprint, jsonify, request
from models.init import db
from models.metodo_pago import MetodoPago

metodo_pago_bp = Blueprint('metodo_pago', __name__)


@metodo_pago_bp.route('/api/metodos-pago')
def get_metodos_pago():
    metodos = MetodoPago.query.order_by(MetodoPago.id).all()
    return jsonify([{'id': m.id, 'nombre': m.nombre} for m in metodos])


@metodo_pago_bp.route('/api/metodos-pago', methods=['POST'])
def create_metodo_pago():
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400
    if len(nombre) > 30:
        return jsonify({'error': 'El nombre no puede exceder 30 caracteres'}), 400
    if MetodoPago.query.filter_by(nombre=nombre).first():
        return jsonify({'error': 'Ya existe un método de pago con ese nombre'}), 409
    metodo = MetodoPago(nombre=nombre)
    db.session.add(metodo)
    db.session.commit()
    return jsonify({'id': metodo.id, 'nombre': metodo.nombre}), 201


@metodo_pago_bp.route('/api/metodos-pago/<int:id>', methods=['PUT'])
def update_metodo_pago(id):
    metodo = MetodoPago.query.get_or_404(id)
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400
    if len(nombre) > 30:
        return jsonify({'error': 'El nombre no puede exceder 30 caracteres'}), 400
    existente = MetodoPago.query.filter_by(nombre=nombre).first()
    if existente and existente.id != id:
        return jsonify({'error': 'Ya existe un método de pago con ese nombre'}), 409
    metodo.nombre = nombre
    db.session.commit()
    return jsonify({'id': metodo.id, 'nombre': metodo.nombre})


@metodo_pago_bp.route('/api/metodos-pago/<int:id>', methods=['DELETE'])
def delete_metodo_pago(id):
    metodo = MetodoPago.query.get_or_404(id)
    db.session.delete(metodo)
    db.session.commit()
    return jsonify({'success': True})
