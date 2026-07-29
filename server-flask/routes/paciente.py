from flask import Blueprint, request, jsonify
from models.init import db
from models.pacientes import Pacientes
from models.doctores import Doctores
from models.accesos import Accesos
from models.filtros import Filtros

paciente_bp = Blueprint('paciente', __name__)

@paciente_bp.route('/api/patient', methods=['GET'])
def get_patients():
    pacientes = Pacientes.query.all()
    result = []
    for p in pacientes:
        result.append({
            'no_expediente': p.no_expediente,
            'nombre': p.nombre,
            'fecha_nacimiento': p.fecha_nacimiento.isoformat() if p.fecha_nacimiento else None,
            'hierros': p.hierros,
            'eritropoyetina': p.eritropoyetina,
            'observaciones': p.observaciones,
            'fecha_inicio_filtro': p.fecha_inicio_filtro.isoformat() if p.fecha_inicio_filtro else None,
            'fecha_fin_filtro': p.fecha_fin_filtro.isoformat() if p.fecha_fin_filtro else None,
            'doctor': p.doctor.nombre if p.doctor else None,
            'acceso': p.acceso.tipo if p.acceso else None,
            'filtro': p.filtro.estado if p.filtro else None,
        })
    return jsonify(result)