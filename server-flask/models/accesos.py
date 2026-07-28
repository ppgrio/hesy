from models.init import db

class Accesos(db.Model):
    id = db.Column(db.Integer , primary_key=True)
    tipo = db.Column(db.String(5), nullable=False, unique = True)