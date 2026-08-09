from flask import Blueprint, jsonify, request
from models.init import db
from models.accesos import Accesos
from models.pacientes import Pacientes
from models.sesiones import Sesiones

acceso_bp = Blueprint('acceso', __name__)


@acceso_bp.route('/api/accesos')
def get_accesos():
    accesos = Accesos.query.order_by(Accesos.id).all()
    return jsonify([{'id': a.id, 'tipo': a.tipo} for a in accesos])


@acceso_bp.route('/api/accesos', methods=['POST'])
def create_acceso():
    data = request.get_json()
    tipo = data.get('tipo', '').strip()
    if not tipo:
        return jsonify({'error': 'El tipo es obligatorio'}), 400
    if len(tipo) > 5:
        return jsonify({'error': 'El tipo no puede exceder 5 caracteres'}), 400
    if Accesos.query.filter_by(tipo=tipo).first():
        return jsonify({'error': 'Ya existe un acceso con ese tipo'}), 409
    acceso = Accesos(tipo=tipo)
    db.session.add(acceso)
    db.session.commit()
    return jsonify({'id': acceso.id, 'tipo': acceso.tipo}), 201


@acceso_bp.route('/api/accesos/<int:id>', methods=['PUT'])
def update_acceso(id):
    acceso = Accesos.query.get_or_404(id)
    data = request.get_json()
    tipo = data.get('tipo', '').strip()
    if not tipo:
        return jsonify({'error': 'El tipo es obligatorio'}), 400
    if len(tipo) > 5:
        return jsonify({'error': 'El tipo no puede exceder 5 caracteres'}), 400
    existente = Accesos.query.filter_by(tipo=tipo).first()
    if existente and existente.id != id:
        return jsonify({'error': 'Ya existe un acceso con ese tipo'}), 409
    acceso.tipo = tipo
    db.session.commit()
    return jsonify({'id': acceso.id, 'tipo': acceso.tipo})


@acceso_bp.route('/api/accesos/<int:id>', methods=['DELETE'])
def delete_acceso(id):
    acceso = Accesos.query.get_or_404(id)
    pac = Pacientes.query.filter_by(acceso_id=id).count()
    ses = Sesiones.query.filter_by(acceso_sesion=id).count()
    total = pac + ses
    if total > 0:
        return jsonify({'error': f'No se puede eliminar, está referenciado en {total} registro(s).'}), 409
    db.session.delete(acceso)
    db.session.commit()
    return jsonify({'success': True})
