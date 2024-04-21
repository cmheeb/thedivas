from flask import Flask, render_template, request, jsonify, redirect, url_for, make_response, send_from_directory
from flask_pymongo import PyMongo
from flask_socketio import SocketIO
from dotenv import load_dotenv
from uuid import uuid4
import os
import bcrypt
import hashlib
import html

# Loading environtment variable
load_dotenv()

# Setting up flask to use "public" as the static folder
app = Flask(__name__, template_folder="public", static_folder="public")

# Setting up MongoDB
app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/user-creds")
mongo = PyMongo(app)

# Setting up SocketIO
socketio = SocketIO(app)

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
        response = make_response(jsonify(message="Login Successful", username=username), 200)
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

# Create Posts
@app.route('/createpost', methods=['POST'])
def createpost():
    # users collection
    users = mongo.db.users
    # posts collection
    postsCollection = mongo.db.posts

    # Checking for auth token
    if 'auth_token' not in request.cookies:
        return jsonify(message = "Not authenticated"), 401
    

    token = request.cookies.get('auth_token')
    tokenHash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    user = users.find_one({'tokenHash': tokenHash})

    # Check if user was found
    if not user:
        return jsonify(message = "Not authenticated"), 401
    
    # Generating random post ID
    postID = uuid4().hex

    # Getting data from the form
    postType = request.form.get('type')
    text = request.form.get('text')
    image = request.files.get('image')
    imageURL = None

    # Checking if image is in request
    if image:
        # Checking if the file is actually an image
        allowedExtensions = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
        fileType = os.path.splitext(image.filename)[1]
        if fileType in allowedExtensions:
            fileName = f'{uuid4().hex}{fileType}'
            image.save(os.path.join('/app/public/images/user_images', fileName))
            imageURL = f'/public/images/user_images/{fileName}'
        else:
            return jsonify(message = "File type not allowed"), 400

        

    postsCollection.insert_one({
        'username': user['username'],
        'content': html.escape(text),
        'type': postType,
        'ID': postID,
        'imageURL': imageURL,
        'likes': [] # Initializing array for likes
    })
    return jsonify(status='ok', message='Posts created successfully', postID=postID)

# Serving Images
@app.route('/images/user_images/<filename>')
def uploaded_file(filename):
    return send_from_directory('/app/public/images/user_images', filename)

# Get Posts
@app.route('/getposts', methods=['GET'])
def getposts():
    # Posts collection
    postsCollection = mongo.db.posts
    
    # Getting thread type from request
    threadType = request.args.get('threadType')

    # Getting posts from collection
    posts = postsCollection.find({'type': threadType})

    # Converting posts to JSON functional list
    posts_list = [{
        'username': post['username'],
        'content': post['content'],
        'type': post['type'],
        'ID': post['ID'],
        'imageURL': post.get('imageURL'),
        'likeCount': len(post.get('likes', []))
    } for post in posts]

    # Returing post list
    return jsonify(posts_list)

# Like Posts
@app.route('/likepost', methods=['POST'])
def likepost():
    # Getting collections
    users = mongo.db.users
    posts = mongo.db.posts

    # Getting post id from request
    postID = request.json.get('postID')

    if 'auth_token' not in request.cookies:
        return jsonify(message="No auth token"), 401
    
    token = request.cookies.get('auth_token')
    tokenHash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    user = users.find_one({'tokenHash': tokenHash})

    if not user:
        return jsonify(message = "User not found"), 401

    username = user['username']


    # Getting post with id
    post = posts.find_one({'ID': postID})

    # Checking if post doesn't exist
    if not post:
        return jsonify(message = "Post not found"), 404
    
    # Checking if user already like the post
    if username in post.get('likes', []):
        # Remove user from liked list
        posts.update_one({'ID': postID}, {'$pull': {'likes': username}})
        return jsonify(message = "Removed like from post"), 200
    else:
        # Adding user to liked list
        posts.update_one({'ID': postID}, {'$push': {'likes': username}})
        return jsonify(message = "Liked post"), 200


if __name__ == '__main__':
    print("Listening on port 8080")
    app.run(debug=True)    