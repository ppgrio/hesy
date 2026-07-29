import random
from datetime import datetime, date, timedelta, time
from flask import Flask
from flask_cors import CORS
from models.init import db
from models.pacientes import Pacientes
from models.doctores import Doctores
from models.accesos import Accesos
from models.filtros import Filtros
from models.sesiones import Sesiones

app = Flask(__name__)
CORS(app)
app.config.from_object('config')
db.init_app(app)

nombres = [
    'Juan', 'María', 'Carlos', 'Ana', 'José', 'Laura', 'Miguel', 'Sofía',
    'Pedro', 'Elena', 'Luis', 'Carmen', 'Jorge', 'Rosa', 'Alberto', 'Isabel',
    'Rafael', 'Patricia', 'Antonio', 'Marta', 'Diego', 'Lucía', 'Manuel',
    'Cristina', 'Francisco', 'Mónica', 'Javier', 'Silvia', 'Ángel', 'Teresa',
    'David', 'Raquel', 'Pablo', 'Natalia', 'Sergio', 'Sara', 'Raúl', 'Eva',
    'Fernando', 'Claudia', 'Héctor', 'Daniela', 'Óscar', 'Julia', 'Víctor',
    'Lorena', 'Rubén', 'Paula', 'Adrián', 'Andrea', 'Hugo', 'Valeria',
    'Martín', 'Camila', 'Santiago', 'Gabriela', 'Mateo', 'Mariana', 'Lucas',
]

apellidos = [
    'García', 'Rodríguez', 'Martínez', 'López', 'Hernández', 'González',
    'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Morales',
    'Ortiz', 'Vázquez', 'Cruz', 'Reyes', 'Gutiérrez', 'Mendoza', 'Molina',
    'Rojas', 'Castillo', 'Romero', 'Moreno', 'Álvarez', 'Delgado', 'Castro',
    'Vargas', 'Herrera', 'Medina', 'Aguilar', 'Garza', 'Fernández', 'Chávez',
    'Ruiz', 'Díaz', 'Jiménez', 'Navarro', 'Domínguez', 'Velázquez',
]

doctores_nombres = [
    'Dr. Gómez', 'Dra. Rivas', 'Dr. Medina', 'Dra. Campos',
    'Dr. Silva', 'Dra. Vega', 'Dr. Peña', 'Dra. Flores',
    'Dr. Luna', 'Dr. Ríos',
]

accesos_tipos = ['AVF', 'AVG', 'CVC', 'FAVI', 'PD']

filtros_estados = ['Activo', 'Inactivo', 'Pendiente']

def seed():
    with app.app_context():
        db.create_all()

        if Doctores.query.first():
            print('La BD ya tiene datos. Saliendo...')
            return

        print('Sembrando doctores...')
        for nombre in doctores_nombres:
            db.session.add(Doctores(nombre=nombre))
        db.session.commit()
        doctores = Doctores.query.all()

        print('Sembrando accesos...')
        for tipo in accesos_tipos:
            db.session.add(Accesos(tipo=tipo))
        db.session.commit()
        accesos = Accesos.query.all()

        print('Sembrando filtros...')
        for estado in filtros_estados:
            db.session.add(Filtros(estado=estado))
        db.session.commit()
        filtros = Filtros.query.all()

        print('Sembrando 1000 pacientes...')
        for i in range(1000):
            nombre = f'{random.choice(nombres)} {random.choice(apellidos)}'
            fecha_nac = date(
                random.randint(1940, 2010),
                random.randint(1, 12),
                random.randint(1, 28),
            )
            paciente = Pacientes(
                no_expediente=5000 + i,
                nombre=nombre,
                fecha_nacimiento=fecha_nac,
                hierros=random.choice([None, random.randint(30, 250)]),
                eritropoyetina=random.choice([None, random.randint(1000, 10000)]),
                acceso_id=random.choice(accesos).id,
                doctor_id=random.choice(doctores).id,
                observaciones=random.choice([None, '', 'Control mensual', 'Revisión trimestral', 'Alta']),
                filtro_id=random.choice(filtros).id,
                fecha_inicio_filtro=random.choice([None, date(2025, 1, 1) + timedelta(days=random.randint(0, 365))]),
                fecha_fin_filtro=None,
            )
            db.session.add(paciente)

            if (i + 1) % 200 == 0:
                db.session.commit()
                print(f'  {i + 1} pacientes...')

        db.session.commit()
        print('  1000 pacientes listos.')

        pacientes_ids = [p.no_expediente for p in Pacientes.query.all()]

        print('Sembrando 500 sesiones (max 8/día)...')
        start_date = date(2025, 1, 1)
        end_date = date(2026, 7, 28)
        all_dates = [start_date + timedelta(days=i) for i in range((end_date - start_date).days + 1)]

        date_pool = []
        for d in all_dates:
            date_pool.extend([d] * 8)

        random.shuffle(date_pool)
        selected_dates = date_pool[:500]

        for d in selected_dates:
            hora = time(
                random.randint(7, 18),
                random.choice([0, 15, 30, 45]),
                random.randint(0, 59),
            )
            dt = datetime.combine(d, hora)
            sesion = Sesiones(
                paciente_id=random.choice(pacientes_ids),
                fecha_hora=dt,
            )
            db.session.add(sesion)

        db.session.commit()
        print('  500 sesiones listas.')
        print('Seed completado.')

seed()
