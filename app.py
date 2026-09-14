import re
from datetime import datetime

from flask import Flask, jsonify, request, send_from_directory
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from flask_sqlalchemy import SQLAlchemy
from markupsafe import Markup

app = Flask(__name__, static_folder='.', static_url_path='')
# ponytail: SQLite в одном файле + ключ-заглушка, вынести SECRET_KEY в env когда выйдешь в сеть
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///onlyyan.db'
app.config['SECRET_KEY'] = 'super-secret-onlyyan-key'

db = SQLAlchemy(app)

HEX = re.compile(r'^#[0-9a-fA-F]{6}$')
MAIL = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
SIZES = ('S', 'M', 'L', 'XL')


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.String(50), nullable=False)
    size = db.Column(db.String(10), nullable=False)
    color_hex = db.Column(db.String(20), nullable=False)
    phone = db.Column(db.String(50), default='')
    email = db.Column(db.String(120), default='')
    address = db.Column(db.String(300), default='')
    design_front = db.Column(db.Text, default='')
    design_back = db.Column(db.Text, default='')
    mockup_front = db.Column(db.Text, default='')
    mockup_back = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


def _img_formatter(view, context, model, name):
    data = getattr(model, name) or ''
    if data.startswith('data:image'):
        return Markup(f'<img src="{data}" width="150">')
    return ''


class OrderView(ModelView):
    column_list = ('id', 'created_at', 'product_name', 'price', 'size', 'color_hex', 'phone', 'email', 'address', 'mockup_front', 'mockup_back', 'design_front', 'design_back')
    column_formatters = {'mockup_front': _img_formatter, 'mockup_back': _img_formatter, 'design_front': _img_formatter, 'design_back': _img_formatter}


admin = Admin(app, name='OnlyYan Admin', url='/admin')
admin.add_view(OrderView(Order, db))


@app.after_request
def cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


@app.route('/api/orders', methods=['POST', 'OPTIONS'])
def create_order():
    if request.method == 'OPTIONS':
        return ('', 200)
    data = request.get_json(force=True, silent=True) or {}
    size = data.get('size', 'M')
    color = data.get('color', '#2b2b2b')
    phone = str(data.get('phone', '')).strip()
    email = str(data.get('email', '')).strip()
    address = str(data.get('address', '')).strip()
    front = data.get('design_front', '')
    back = data.get('design_back', '')
    mock_front = data.get('mockup_front', '')
    mock_back = data.get('mockup_back', '')
    if size not in SIZES or not HEX.match(color or ''):
        return jsonify({'status': 'error', 'message': 'Bad size or color'}), 400
    if not phone or not MAIL.match(email or '') or not address:
        return jsonify({'status': 'error', 'message': 'Bad contacts'}), 400
    if len(front) + len(back) + len(mock_front) + len(mock_back) > 8_000_000:
        return jsonify({'status': 'error', 'message': 'Design too large'}), 400
    order = Order(
        product_name=str(data.get('product_name', 'Custom Tee'))[:100],
        price=str(data.get('price', '0 AMD'))[:50],
        size=size,
        color_hex=color,
        phone=phone[:50],
        email=email[:120],
        address=address[:300],
        design_front=front,
        design_back=back,
        mockup_front=mock_front,
        mockup_back=mock_back,
    )
    db.session.add(order)
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Заказ оформлен', 'order_id': order.id}), 201


@app.route('/')
def home():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def static_files(path):
    if path.startswith(('api', 'admin')):
        return ('', 404)
    return send_from_directory('.', path)


def _self_check():
    assert HEX.match('#2b2b2b') and not HEX.match('red')
    assert MAIL.match('a@b.cc') and not MAIL.match('not-mail')
    assert 'M' in SIZES and 'XXL' not in SIZES
    print('self-check ok')


with app.app_context():
    db.create_all()
    _cols = [r[1] for r in db.session.execute(db.text('PRAGMA table_info("order")')).fetchall()]
    for _col in ('mockup_front', 'mockup_back', 'phone', 'email', 'address'):
        if _col not in _cols:
            db.session.execute(db.text(f'ALTER TABLE "order" ADD COLUMN {_col} TEXT DEFAULT ""'))
    db.session.commit()


if __name__ == '__main__':
    import sys
    if '--check' in sys.argv:
        _self_check()
    else:
        app.run(debug=True, port=5000)
