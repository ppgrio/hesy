from models.init import db

class Inventario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(30), nullable=False, unique = True)
    cantidad = db.Column(db.Integer, nullable = False)
    caducidad = db.Column(db.Date)
    area_id = db.Column(db.Integer, db.ForeignKey('areas.id'))

    area = db.relationship('Areas', backref = 'inventario')