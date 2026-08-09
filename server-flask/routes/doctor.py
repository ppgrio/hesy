from flask import Blueprint, jsonify, request
from models.init import db
from models.doctores import Doctores
from models.pacientes import Pacientes

doctor_bp = Blueprint('doctor', __name__)

@doctor_bp.route('/api/doctor')
def get_doctors():
    doctores = Doctores.query.all()
    return jsonify([{
        'id': d.id,
        'nombre': d.nombre,
    } for d in doctores])

@doctor_bp.route('/api/doctor', methods=['POST'])
def create_doctor():
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400
    if len(nombre) > 20:
        return jsonify({'error': 'El nombre no puede exceder 20 caracteres'}), 400
    if Doctores.query.filter_by(nombre=nombre).first():
        return jsonify({'error': 'Ya existe un doctor con ese nombre'}), 409
    doctor = Doctores(nombre=nombre)
    db.session.add(doctor)
    db.session.commit()
    return jsonify({'id': doctor.id, 'nombre': doctor.nombre}), 201

@doctor_bp.route('/api/doctor/<int:id>', methods=['PUT'])
def update_doctor(id):
    doctor = Doctores.query.get_or_404(id)
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400
    if len(nombre) > 20:
        return jsonify({'error': 'El nombre no puede exceder 20 caracteres'}), 400
    existente = Doctores.query.filter_by(nombre=nombre).first()
    if existente and existente.id != id:
        return jsonify({'error': 'Ya existe un doctor con ese nombre'}), 409
    doctor.nombre = nombre
    db.session.commit()
    return jsonify({'id': doctor.id, 'nombre': doctor.nombre})

@doctor_bp.route('/api/doctor/<int:id>', methods=['DELETE'])
def delete_doctor(id):
    doctor = Doctores.query.get_or_404(id)
    pacientes_asignados = Pacientes.query.filter_by(doctor_id=id).count()
    if pacientes_asignados > 0:
        return jsonify({'error': f'No se puede eliminar, tiene {pacientes_asignados} paciente(s) asignado(s).'}), 409
    db.session.delete(doctor)
    db.session.commit()
    return jsonify({'success': True})
