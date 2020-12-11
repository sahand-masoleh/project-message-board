const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

const BOARD = 'test'
const THREADS_URL = `/api/threads/${BOARD}`
const REPLIES_URL = `/api/replies/${BOARD}`
const delete_password = '123456'
let thread_id
let reply_id

suite('Functional Tests', () => {
  test('Creating a new thread', (done) => {
    let text = 'first thread'
    chai
      .request(server)
      .post(THREADS_URL)
      .send({ text, delete_password })
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.equal(res.text, 'success')
        done()
      })
  }),
    test('Viewing the 10 most recent threads with 3 replies each', (done) => {
      chai
        .request(server)
        .get(THREADS_URL)
        .end((err, res) => {
          thread_id = res.body[0]._id
          assert.equal(res.status, 200)
          assert.isArray(res.body)
          done()
        })
    }),
    test('Reporting a thread', (done) => {
      chai
        .request(server)
        .put(THREADS_URL)
        .send({ thread_id })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.equal(res.text, 'success')
          done()
        })
    }),
    test('Creating a new reply', (done) => {
      chai
        .request(server)
        .post(REPLIES_URL)
        .send({ text: 'first reply', thread_id, delete_password })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.equal(res.text, 'success')
          done()
        })
    }),
    test('Viewing a single thread with all replies', (done) => {
      chai
        .request(server)
        .get(REPLIES_URL)
        .query({ thread_id })
        .end((err, res) => {
          reply_id = res.body.replies[0]._id
          assert.equal(res.status, 200)
          assert.isArray(res.body.replies)
          done()
        })
    }),
    test('Reporting a reply', (done) => {
      chai
        .request(server)
        .put(REPLIES_URL)
        .send({ thread_id, reply_id })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.equal(res.text, 'success')
          done()
        })
    }),
  test('Deleting a reply with the incorrect password', (done) => {
    chai
      .request(server)
      .delete(REPLIES_URL)
      .send({ thread_id, reply_id, delete_password: 'wrong password' })
      .end((err, res) => {
        assert.equal(res.status, 400)
        assert.equal(res.text, 'incorrect password')
        done()
      })
  }),
    test('Deleting a thread with the incorrect password', (done) => {
    chai
      .request(server)
      .delete(THREADS_URL)
      .send({ thread_id, delete_password: 'wrong password' })
      .end((err, res) => {
        assert.equal(res.status, 400)
        assert.equal(res.text, 'incorrect password')
        done()
      })
  }),
  test('Deleting a reply with the correct password', (done) => {
    chai
      .request(server)
      .delete(REPLIES_URL)
      .send({ thread_id, reply_id, delete_password })
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.equal(res.text, 'success')
        done()
      })
  }),
    test('Deleting a thread with the correct password', (done) => {
    chai
      .request(server)
      .delete(THREADS_URL)
      .send({ thread_id, delete_password })
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.equal(res.text, 'success')
        done()
      })
  })
});
