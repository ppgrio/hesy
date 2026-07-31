from flask import Blueprint, jsonify
from models.inventario import Inventario

inventario_bp = Blueprint('inventario', __name__)

@inventario_bp.route('/api/inventario')
def get_inventario():
    items = Inventario.query.all()
    return jsonify([{
        'id': i.id,
        'nombre': i.nombre,
        'cantidad': i.cantidad,
        'caducidad': i.caducidad.isoformat() if i.caducidad else None,
        'area': i.area.nombre if i.area else None,
    } for i in items])
