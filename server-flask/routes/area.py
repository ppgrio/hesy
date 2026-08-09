from flask import Blueprint, jsonify, request
from models.init import db
from models.areas import Areas
from models.inventario import Inventario

area_bp = Blueprint('area', __name__)


@area_bp.route('/api/areas')
def get_areas():
    areas = Areas.query.order_by(Areas.id).all()
    return jsonify([{'id': a.id, 'nombre': a.nombre} for a in areas])


@area_bp.route('/api/areas', methods=['POST'])
def create_area():
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400
    if len(nombre) > 30:
        return jsonify({'error': 'El nombre no puede exceder 30 caracteres'}), 400
    if Areas.query.filter_by(nombre=nombre).first():
        return jsonify({'error': 'Ya existe un área con ese nombre'}), 409
    area = Areas(nombre=nombre)
    db.session.add(area)
    db.session.commit()
    return jsonify({'id': area.id, 'nombre': area.nombre}), 201


@area_bp.route('/api/areas/<int:id>', methods=['PUT'])
def update_area(id):
    area = Areas.query.get_or_404(id)
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400
    if len(nombre) > 30:
        return jsonify({'error': 'El nombre no puede exceder 30 caracteres'}), 400
    existente = Areas.query.filter_by(nombre=nombre).first()
    if existente and existente.id != id:
        return jsonify({'error': 'Ya existe un área con ese nombre'}), 409
    area.nombre = nombre
    db.session.commit()
    return jsonify({'id': area.id, 'nombre': area.nombre})


@area_bp.route('/api/areas/<int:id>', methods=['DELETE'])
def delete_area(id):
    area = Areas.query.get_or_404(id)
    items = Inventario.query.filter_by(area_id=id).count()
    if items > 0:
        return jsonify({'error': f'No se puede eliminar, tiene {items} item(s) en inventario.'}), 409
    db.session.delete(area)
    db.session.commit()
    return jsonify({'success': True})
