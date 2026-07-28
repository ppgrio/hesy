from models.init import db

class Doctores(db.Model):
    id = db.Column(db.Integer , primary_key=True)
    nombre = db.Column(db.String(20), nullable=False)