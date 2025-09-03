#!/usr/bin/env node
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

if (!uri) {
  console.error('No MongoDB URI found. Set MONGODB_URI or VITE_MONGODB_URI in your environment.');
  process.exit(1);
}

async function seed() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db('aqua_flow');

    // Profiles
    const profiles = db.collection('profiles');
    await profiles.updateOne({ id: 'profile-customer' }, { $set: { id: 'profile-customer', user_id: 'demo-customer', name: 'Demo Customer', account_type: 'customer', phone: null, created_at: new Date() } }, { upsert: true });
    await profiles.updateOne({ id: 'profile-vendor' }, { $set: { id: 'profile-vendor', user_id: 'demo-vendor', name: 'Demo Vendor', account_type: 'vendor', phone: null, created_at: new Date() } }, { upsert: true });

    // Vendors
    const vendors = db.collection('vendors');
    await vendors.updateOne({ id: 'vendor-1' }, { $set: { id: 'vendor-1', name: 'Aqua Vendor', delivery_fee: 5.99, delivery_time: '30-45 mins', created_at: new Date() } }, { upsert: true });

    // Products
    const products = db.collection('products');
    await products.updateOne({ id: 'product-1' }, { $set: { id: 'product-1', name: '5L Bottle', price: 9.99, image_url: null, vendor_id: 'vendor-1', created_at: new Date() } }, { upsert: true });
    await products.updateOne({ id: 'product-2' }, { $set: { id: 'product-2', name: '20L Drum', price: 24.99, image_url: null, vendor_id: 'vendor-1', created_at: new Date() } }, { upsert: true });

    // Orders (full_orders) and order_items
    const fullOrders = db.collection('full_orders');
    const orderItems = db.collection('order_items');

    const orderId = 'order-demo-1';
    await fullOrders.updateOne({ id: orderId }, { $set: {
      id: orderId,
      user_id: 'demo-customer',
      customer_name: 'Demo Customer',
      delivery_address: '123 Demo St',
      payment_method: 'card',
      status: 'completed',
      subtotal: 34.98,
      delivery_fee: 5.99,
      total: 40.97,
      created_at: new Date()
    } }, { upsert: true });

    await orderItems.updateOne({ id: 'oi-1' }, { $set: {
      id: 'oi-1',
      order_id: orderId,
      product_id: 'product-1',
      product_name: '5L Bottle',
      quantity: 2,
      amount: 19.98,
      price: 9.99,
      vendor_id: 'vendor-1',
      vendor_name: 'Aqua Vendor'
    } }, { upsert: true });

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
