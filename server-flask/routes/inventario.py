from flask import Blueprint, jsonify, request
from models.init import db
from models.inventario import Inventario
from models.areas import Areas
from models.medicamentos_sesion import MedicamentosSesion
from sqlalchemy import String

inventario_bp = Blueprint('inventario', __name__)


def serializar(i):
    return {
        'id': i.id,
        'codigo': i.codigo,
        'nombre': i.nombre,
        'cantidad': i.cantidad,
        'caducidad': i.caducidad.isoformat() if i.caducidad else None,
        'area_id': i.area_id,
        'area': i.area.nombre if i.area else None,
    }


@inventario_bp.route('/api/inventario')
def get_inventario():
    page = request.args.get('page', 1, type=int)
    page_size = min(max(request.args.get('page_size', 100, type=int), 1), 1000)
    dir_ = 'desc' if request.args.get('dir', 'asc') == 'desc' else 'asc'

    q = Inventario.query.join(Areas, Inventario.area_id == Areas.id, isouter=True)
    for key in ('codigo', 'nombre', 'cantidad', 'caducidad', 'area'):
        v = request.args.get(key, '').strip()
        if not v:
            continue
        col = Areas.nombre if key == 'area' else getattr(Inventario, key)
        if key in ('codigo', 'cantidad'):
            try:
                q = q.filter(col == int(v))
            except ValueError:
                pass
        else:
            q = q.filter(col.cast(String).ilike(f'%{v}%'))

    sort = request.args.get('sort', 'codigo')
    sort_col = Areas.nombre if sort == 'area' else getattr(Inventario, sort, Inventario.codigo)
    q = q.order_by(sort_col.desc() if dir_ == 'desc' else sort_col.asc())

    pag = q.paginate(page=page, per_page=page_size, error_out=False)
    return jsonify({
        'items': [serializar(i) for i in pag.items],
        'total': pag.total,
        'page': pag.page,
        'page_size': page_size,
        'total_pages': pag.pages,
    })


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
    return jsonify(serializar(item)), 201


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
    return jsonify(serializar(item))


@inventario_bp.route('/api/inventario/<int:id>', methods=['DELETE'])
def delete_inventario(id):
    item = Inventario.query.get_or_404(id)
    usos = MedicamentosSesion.query.filter_by(inventario_id=id).count()
    if usos > 0:
        return jsonify({'error': f'No se puede eliminar, el item está referenciado en {usos} sesión(es).'}), 409
    db.session.delete(item)
    db.session.commit()
    return jsonify({'success': True})
