from flask import Blueprint, jsonify, request
from models.init import db
from models.filtros import Filtros
from models.pacientes import Pacientes
from models.sesiones import Sesiones

filtro_bp = Blueprint('filtro', __name__)


def serializar(f):
    return {'id': f.id, 'estado': f.estado, 'precio': float(f.precio) if f.precio is not None else None}


@filtro_bp.route('/api/filtros')
def get_filtros():
    filtros = Filtros.query.order_by(Filtros.id).all()
    return jsonify([serializar(f) for f in filtros])


def leer_precio(data):
    precio = data.get('precio')
    try:
        precio = float(precio)
    except (TypeError, ValueError):
        return None, 'El precio debe ser un número'
    if precio < 0:
        return None, 'El precio no puede ser negativo'
    return precio, None


@filtro_bp.route('/api/filtros', methods=['POST'])
def create_filtro():
    data = request.get_json()
    estado = data.get('estado', '').strip()
    if not estado:
        return jsonify({'error': 'El estado es obligatorio'}), 400
    if len(estado) > 10:
        return jsonify({'error': 'El estado no puede exceder 10 caracteres'}), 400
    precio, err = leer_precio(data)
    if err:
        return jsonify({'error': err}), 400
    if Filtros.query.filter_by(estado=estado).first():
        return jsonify({'error': 'Ya existe un filtro con ese estado'}), 409
    filtro = Filtros(estado=estado, precio=precio)
    db.session.add(filtro)
    db.session.commit()
    return jsonify(serializar(filtro)), 201


@filtro_bp.route('/api/filtros/<int:id>', methods=['PUT'])
def update_filtro(id):
    filtro = Filtros.query.get_or_404(id)
    data = request.get_json()
    estado = data.get('estado', '').strip()
    if not estado:
        return jsonify({'error': 'El estado es obligatorio'}), 400
    if len(estado) > 10:
        return jsonify({'error': 'El estado no puede exceder 10 caracteres'}), 400
    precio, err = leer_precio(data)
    if err:
        return jsonify({'error': err}), 400
    existente = Filtros.query.filter_by(estado=estado).first()
    if existente and existente.id != id:
        return jsonify({'error': 'Ya existe un filtro con ese estado'}), 409
    filtro.estado = estado
    filtro.precio = precio
    db.session.commit()
    return jsonify(serializar(filtro))


@filtro_bp.route('/api/filtros/<int:id>', methods=['DELETE'])
def delete_filtro(id):
    filtro = Filtros.query.get_or_404(id)
    pac = Pacientes.query.filter_by(filtro_id=id).count()
    ses = Sesiones.query.filter_by(filtro_sesion=id).count()
    total = pac + ses
    if total > 0:
        return jsonify({'error': f'No se puede eliminar, está referenciado en {total} registro(s).'}), 409
    db.session.delete(filtro)
    db.session.commit()
    return jsonify({'success': True})
