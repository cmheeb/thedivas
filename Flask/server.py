from flask import Flask, render_template, request, jsonify, redirect, url_for, make_response
from flask_pymongo import PyMongo
from dotenv import load_dotenv
import os
import bcrypt
import hashlib

# Loading environtment variable
load_dotenv()

# Setting up flask to use "public" as the static folder
app = Flask(__name__, template_folder="public", static_folder="public")

# Setting up MongoDB
app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/user-creds")
mongo = PyMongo(app)

# Favion
@app.route('/favicon.ico')
def favicon():
    return url_for('static', filename='images/favicon.ico')


# Homepage
@app.route('/')
def home():
    return render_template("index.html")


# Registration
@app.route('/register', methods=['POST'])
def register():
    # Users collection
    users = mongo.db.users

    # Getting usrename and password from the form
    username = request.json.get('username')
    password = request.json.get('password')
    passwordConfirm = request.json.get('confirmPassword')

    # Checking if passwords match
    if not password == passwordConfirm:
        return jsonify(message="Passwords don't match"), 403
    
    # Encoding password to bytes
    password = password.encode('utf-8')

    # Checking if the username is already taken
    userExists = users.find_one({'username': username})
    if userExists:
        return jsonify(message="Username already taken"), 403

    # Salting and hashing the password
    hashed_password = bcrypt.hashpw(password, bcrypt.gensalt())

    # Inserting into database and sending 200 response
    users.insert_one({'username': username, 'password': hashed_password})
    return jsonify(message="Success"), 200

# Login
@app.route('/login', methods=['POST'])
def login():
    # Users collection
    users = mongo.db.users

    # Getting username and password from the form
    username = request.json.get('username')
    password = request.json.get('password')

    # Encoding password to bytes
    password = password.encode('utf-8')

    # Getting user from database
    user = users.find_one({'username': username})

    # Checking if password is correct
    if user and bcrypt.checkpw(password, user['password']):
        # Generage auth token and its hash
        token = os.urandom(16).hex()
        tokenHash = hashlib.sha256(token.encode('utf-8')).hexdigest()

        # Storing the hashed token in the db
        users.update_one({'username': username}, {'$set': {'tokenHash': tokenHash}})

        # Sending token to the user as 'auth_token' cookie
        response = make_response(jsonify(message="Login Successful"), 200)
        response.set_cookie('auth_token', token, httponly=True, max_age=3600)
        return response
    
    else:
        return jsonify(message="Invalid username or password"), 401

# Authentication
@app.route('/auth', methods=['GET'])
def auth():
    # Users collection
    users = mongo.db.users

    # Getting auth token from cookies, if it exists
    if 'auth_token' in request.cookies:
        token = request.cookies.get('auth_token')
    else:
        return jsonify(message="No auth token"), 401
    
    # Hashing token and using it to retrieve user form db
    tokenHash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    user = users.find_one({'tokenHash': tokenHash})

    # Checking if token and user are valid
    if not user:
        return jsonify(message="Invalid User"), 401
    
    return jsonify(status='ok', username=user['username']), 200

# Logout
@app.route('/logout', methods=['POST'])
def logout():
    # Users collection
    users = mongo.db.users

    # Getting auth token from cookies, if it exists
    if 'auth_token' in request.cookies:
        token = request.cookies.get('auth_token')
    else:
        return jsonify(message="No auth token"), 401
    
    # Invalidating token
    tokenHash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    users.update_one({'tokenHash': tokenHash}, {'$unset': {'tokenHash': 1}})

    
    # Clearning auth token cookie and sending back 200 response
    response = make_response(jsonify(message="Logout Successful"), 200)
    response.set_cookie('auth_token', '', max_age=0)
    return response

if __name__ == '__main__':
    print("Listening on port 8080")
    app.run(debug=True)    