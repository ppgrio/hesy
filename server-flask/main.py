from flask import Flask
from flask_cors import CORS
from routes.paciente import paciente_bp
from routes.sesion import sesion_bp
from routes.doctor import doctor_bp
from routes.inventario import inventario_bp
from models.init import db
from models.pacientes import Pacientes
from models.doctores import Doctores
from models.accesos import Accesos
from models.filtros import Filtros
from models.sesiones import Sesiones
from models.areas import Areas
from models.inventario import Inventario
from models.medicamentos_sesion import MedicamentosSesion

app = Flask(__name__)
CORS(app)
app.config.from_object('config')
db.init_app(app)

app.register_blueprint(paciente_bp)
app.register_blueprint(sesion_bp)
app.register_blueprint(doctor_bp)
app.register_blueprint(inventario_bp)

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0',debug=True) #by default, Flask runs on port 5000
