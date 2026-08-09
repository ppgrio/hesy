from flask import Blueprint, jsonify, request
from models.init import db
from models.filtros import Filtros
from models.pacientes import Pacientes
from models.sesiones import Sesiones

filtro_bp = Blueprint('filtro', __name__)


@filtro_bp.route('/api/filtros')
def get_filtros():
    filtros = Filtros.query.order_by(Filtros.id).all()
    return jsonify([{'id': f.id, 'estado': f.estado} for f in filtros])


@filtro_bp.route('/api/filtros', methods=['POST'])
def create_filtro():
    data = request.get_json()
    estado = data.get('estado', '').strip()
    if not estado:
        return jsonify({'error': 'El estado es obligatorio'}), 400
    if len(estado) > 10:
        return jsonify({'error': 'El estado no puede exceder 10 caracteres'}), 400
    if Filtros.query.filter_by(estado=estado).first():
        return jsonify({'error': 'Ya existe un filtro con ese estado'}), 409
    filtro = Filtros(estado=estado)
    db.session.add(filtro)
    db.session.commit()
    return jsonify({'id': filtro.id, 'estado': filtro.estado}), 201


@filtro_bp.route('/api/filtros/<int:id>', methods=['PUT'])
def update_filtro(id):
    filtro = Filtros.query.get_or_404(id)
    data = request.get_json()
    estado = data.get('estado', '').strip()
    if not estado:
        return jsonify({'error': 'El estado es obligatorio'}), 400
    if len(estado) > 10:
        return jsonify({'error': 'El estado no puede exceder 10 caracteres'}), 400
    existente = Filtros.query.filter_by(estado=estado).first()
    if existente and existente.id != id:
        return jsonify({'error': 'Ya existe un filtro con ese estado'}), 409
    filtro.estado = estado
    db.session.commit()
    return jsonify({'id': filtro.id, 'estado': filtro.estado})


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
