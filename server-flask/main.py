from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def hello_world():
    return 'Hello world'

@app.route('/api/users')
def get_users():
    return{
        'users':[
            {
                'id':1,
                'name' : 'Alice'
            },
            {
                'id':2,
                'name' : 'Bob'
            },
            {
                'id':3,
                'name' : 'Charlie'
            }
        ]
    }

@app.route('/api/fruits')
def get_fruits():
    return ['Apple', 'Banana', 'Cherry']

if __name__ == '__main__':
    app.run(host='0.0.0.0',debug=True) #by default, Flask runs on port 5000
