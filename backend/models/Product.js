// filepath: backend/models/Product.js
class Product {
	constructor(data) {
		this.id = data.id;
		this.name = data.name;
		this.price = data.price;
		this.link = data.link;
		this.created_at = data.created_at;
		this.updated_at = data.updated_at;
	}
}

module.exports = Product;
