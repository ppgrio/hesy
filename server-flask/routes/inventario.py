from flask import Blueprint, jsonify, request
from models.init import db
from models.inventario import Inventario
from models.areas import Areas
from models.medicamentos_sesion import MedicamentosSesion
from sqlalchemy.orm import joinedload

inventario_bp = Blueprint('inventario', __name__)


@inventario_bp.route('/api/inventario')
def get_inventario():
    items = Inventario.query.options(joinedload(Inventario.area)).all()
    return jsonify([{
        'id': i.id,
        'codigo': i.codigo,
        'nombre': i.nombre,
        'cantidad': i.cantidad,
        'caducidad': i.caducidad.isoformat() if i.caducidad else None,
        'area_id': i.area_id,
        'area': i.area.nombre if i.area else None,
    } for i in items])


@inventario_bp.route('/api/inventario', methods=['POST'])
def create_inventario():
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400
    if len(nombre) > 30:
        return jsonify({'error': 'El nombre no puede exceder 30 caracteres'}), 400
    if Inventario.query.filter_by(nombre=nombre).first():
        return jsonify({'error': 'Ya existe un item con ese nombre'}), 409

    try:
        cantidad = int(data.get('cantidad', 0))
    except (TypeError, ValueError):
        return jsonify({'error': 'La cantidad debe ser un número entero'}), 400
    if cantidad < 0:
        return jsonify({'error': 'La cantidad no puede ser negativa'}), 400

    caducidad = data.get('caducidad')
    if caducidad:
        from datetime import date as dt_date
        try:
            caducidad = dt_date.fromisoformat(caducidad)
        except (ValueError, TypeError):
            return jsonify({'error': 'Formato de fecha inválido'}), 400

    area_id = data.get('area_id')
    if area_id and not Areas.query.get(area_id):
        return jsonify({'error': 'El área seleccionada no existe'}), 400

    codigo = data.get('codigo')
    if codigo is not None:
        try:
            codigo = int(codigo)
        except (TypeError, ValueError):
            return jsonify({'error': 'El código debe ser un número entero'}), 400
        if Inventario.query.filter_by(codigo=codigo).first():
            return jsonify({'error': 'Ya existe un item con ese código'}), 409

    item = Inventario(
        codigo=codigo,
        nombre=nombre,
        cantidad=cantidad,
        caducidad=caducidad,
        area_id=area_id,
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({
        'id': item.id,
        'codigo': item.codigo,
        'nombre': item.nombre,
        'cantidad': item.cantidad,
        'caducidad': item.caducidad.isoformat() if item.caducidad else None,
        'area_id': item.area_id,
        'area': item.area.nombre if item.area else None,
    }), 201


@inventario_bp.route('/api/inventario/<int:id>', methods=['PUT'])
def update_inventario(id):
    item = Inventario.query.get_or_404(id)
    data = request.get_json()

    nombre = data.get('nombre', '').strip()
    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400
    if len(nombre) > 30:
        return jsonify({'error': 'El nombre no puede exceder 30 caracteres'}), 400
    existente = Inventario.query.filter_by(nombre=nombre).first()
    if existente and existente.id != id:
        return jsonify({'error': 'Ya existe un item con ese nombre'}), 409

    codigo = data.get('codigo')
    if codigo is not None:
        try:
            codigo = int(codigo)
        except (TypeError, ValueError):
            return jsonify({'error': 'El código debe ser un número entero'}), 400
        existente_codigo = Inventario.query.filter_by(codigo=codigo).first()
        if existente_codigo and existente_codigo.id != id:
            return jsonify({'error': 'Ya existe un item con ese código'}), 409

    try:
        cantidad = int(data.get('cantidad', 0))
    except (TypeError, ValueError):
        return jsonify({'error': 'La cantidad debe ser un número entero'}), 400
    if cantidad < 0:
        return jsonify({'error': 'La cantidad no puede ser negativa'}), 400

    caducidad = data.get('caducidad')
    if caducidad:
        from datetime import date as dt_date
        try:
            caducidad = dt_date.fromisoformat(caducidad)
        except (ValueError, TypeError):
            return jsonify({'error': 'Formato de fecha inválido'}), 400
    else:
        caducidad = None

    area_id = data.get('area_id')
    if area_id and not Areas.query.get(area_id):
        return jsonify({'error': 'El área seleccionada no existe'}), 400

    item.codigo = codigo
    item.nombre = nombre
    item.cantidad = cantidad
    item.caducidad = caducidad
    item.area_id = area_id

    db.session.commit()
    return jsonify({
        'id': item.id,
        'codigo': item.codigo,
        'nombre': item.nombre,
        'cantidad': item.cantidad,
        'caducidad': item.caducidad.isoformat() if item.caducidad else None,
        'area_id': item.area_id,
        'area': item.area.nombre if item.area else None,
    })


@inventario_bp.route('/api/inventario/<int:id>', methods=['DELETE'])
def delete_inventario(id):
    item = Inventario.query.get_or_404(id)
    usos = MedicamentosSesion.query.filter_by(inventario_id=id).count()
    if usos > 0:
        return jsonify({'error': f'No se puede eliminar, el item está referenciado en {usos} sesión(es).'}), 409
    db.session.delete(item)
    db.session.commit()
    return jsonify({'success': True})


@inventario_bp.route('/api/areas')
def get_areas():
    areas = Areas.query.all()
    return jsonify([{'id': a.id, 'nombre': a.nombre} for a in areas])
