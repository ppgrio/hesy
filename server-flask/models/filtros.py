from models.init import db

class Filtros(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    estado = db.Column(db.String(10), nullable=False, unique = True)