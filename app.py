from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import xml.etree.ElementTree as ET

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///animelist.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class SavedAnime(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, default=1) 
    anime_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(50), default="Plan to Watch")
    synopsis = db.Column(db.Text, nullable=True)
    personal_score = db.Column(db.Integer, nullable=True)
    episodes_watched = db.Column(db.Integer, default=0)
    total_episodes = db.Column(db.Integer, nullable=True)
    start_date = db.Column(db.String(20), nullable=True)
    finish_date = db.Column(db.String(20), nullable=True)
    comments = db.Column(db.Text, nullable=True)
    tags = db.Column(db.String(200), nullable=True)
    times_watched = db.Column(db.Integer, default=0)

with app.app_context():
    db.create_all()

@app.route('/api/save', methods=['POST'])
def save_anime():
    data = request.get_json()
    existing_anime = SavedAnime.query.filter_by(anime_id=data['anime_id'], user_id=1).first()
    
    if existing_anime:
        existing_anime.status = data['status']
        existing_anime.personal_score = data.get('personal_score')
        existing_anime.episodes_watched = data.get('episodes_watched', 0)
        existing_anime.total_episodes = data.get('total_episodes')
        
        if 'start_date' in data: existing_anime.start_date = data['start_date']
        if 'finish_date' in data: existing_anime.finish_date = data['finish_date']
        if 'comments' in data: existing_anime.comments = data['comments']
        if 'tags' in data: existing_anime.tags = data['tags']
        if 'times_watched' in data: existing_anime.times_watched = data['times_watched']
        
        if existing_anime.image_url == "placeholder.png" and data['image_url'] != "placeholder.png":
            existing_anime.image_url = data['image_url']
            existing_anime.synopsis = data.get('synopsis', '')
            
        db.session.commit()
        return jsonify({"message": f"Updated status to {data['status']}!"}), 200

    new_anime = SavedAnime(
        anime_id=data['anime_id'],                 # type: ignore
        title=data['title'],                       # type: ignore
        image_url=data['image_url'],               # type: ignore
        status=data['status'],                     # type: ignore
        synopsis=data.get('synopsis', ''),         # type: ignore
        personal_score=data.get('personal_score'), # type: ignore
        episodes_watched=data.get('episodes_watched', 0), # type: ignore
        total_episodes=data.get('total_episodes'), # type: ignore
        start_date=data.get('start_date', ''),     # type: ignore
        finish_date=data.get('finish_date', ''),   # type: ignore
        comments=data.get('comments', ''),         # type: ignore
        tags=data.get('tags', ''),                 # type: ignore
        times_watched=data.get('times_watched', 0) # type: ignore
    )
    
    db.session.add(new_anime)
    db.session.commit()
    
    return jsonify({"message": "Successfully saved to list!"}), 201

@app.route('/api/import_xml', methods=['POST'])
def import_xml():
    if 'file' not in request.files:
        return jsonify({"message": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No file selected"}), 400

    try:
        # Αγνοούμε το warning του FileStorage
        tree = ET.parse(file) # type: ignore
        root = tree.getroot()
        
        added = 0
        updated = 0
        
        for anime in root.findall('anime'):
            # Αγνοούμε τα warnings για το .text
            anime_id = int(anime.find('series_animedb_id').text or 0) # type: ignore
            if anime_id == 0: continue
            
            title = anime.find('series_title').text or "Unknown" # type: ignore
            total_eps = int(anime.find('series_episodes').text or 0) # type: ignore
            watched_eps = int(anime.find('my_watched_episodes').text or 0) # type: ignore
            score = int(anime.find('my_score').text or 0) # type: ignore
            status = anime.find('my_status').text or "Plan to Watch" # type: ignore
            
            if status == "On-Hold": status = "Plan to Watch"
            
            start_date = anime.find('my_start_date').text or "" # type: ignore
            if start_date == "0000-00-00": start_date = ""
            
            finish_date = anime.find('my_finish_date').text or "" # type: ignore
            if finish_date == "0000-00-00": finish_date = ""
            
            comments = anime.find('my_comments').text or "" # type: ignore
            tags = anime.find('my_tags').text or "" # type: ignore
            times_watched = int(anime.find('my_times_watched').text or 0) # type: ignore
            
            existing = SavedAnime.query.filter_by(anime_id=anime_id, user_id=1).first()
            if existing:
                existing.status = status
                existing.personal_score = score if score > 0 else None
                existing.episodes_watched = watched_eps
                existing.total_episodes = total_eps if total_eps > 0 else None
                existing.start_date = start_date
                existing.finish_date = finish_date
                existing.comments = comments
                existing.tags = tags
                existing.times_watched = times_watched
                updated += 1
            else:
                new_anime = SavedAnime(
                    anime_id=anime_id,                 # type: ignore
                    title=title,                       # type: ignore
                    image_url="placeholder.png",       # type: ignore
                    status=status,                     # type: ignore
                    personal_score=score if score > 0 else None, # type: ignore
                    episodes_watched=watched_eps,      # type: ignore
                    total_episodes=total_eps if total_eps > 0 else None, # type: ignore
                    start_date=start_date,             # type: ignore
                    finish_date=finish_date,           # type: ignore
                    comments=comments,                 # type: ignore
                    tags=tags,                         # type: ignore
                    times_watched=times_watched        # type: ignore
                )
                db.session.add(new_anime)
                added += 1
                
        db.session.commit()
        return jsonify({"message": f"MAL Import Complete! Added: {added}, Updated: {updated}"}), 200
    except Exception as e:
        return jsonify({"message": f"Error parsing XML: {str(e)}"}), 500

@app.route('/api/mylist', methods=['GET'])
def get_my_list():
    my_anime = SavedAnime.query.filter_by(user_id=1).all()
    results = []
    for anime in my_anime:
        results.append({
            "id": anime.id,
            "anime_id": anime.anime_id,
            "title": anime.title,
            "image_url": anime.image_url,
            "status": anime.status,
            "synopsis": anime.synopsis,
            "personal_score": anime.personal_score,
            "episodes_watched": anime.episodes_watched,
            "total_episodes": anime.total_episodes,
            "start_date": anime.start_date,
            "finish_date": anime.finish_date,
            "comments": anime.comments,
            "tags": anime.tags,
            "times_watched": anime.times_watched
        })
    return jsonify(results), 200

if __name__ == '__main__':
    app.run(debug=True)