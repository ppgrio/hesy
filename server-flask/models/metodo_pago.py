from models.init import db

class MetodoPago(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(30), nullable=False, unique=True)
