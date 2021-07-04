let express = require('express');
let multer = require('multer'),
  bodyParser = require('body-parser'),
  path = require('path');
let mongoose = require('mongoose');
let Detail = require('./models/detail');
let fs = require('fs');
let dir = './uploads';
mongoose.connect('mongodb://localhost/uploadFiles');

let upload = multer({
  storage: multer.diskStorage({

    destination: (req, file, callback) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      callback(null, './uploads');
    },
    filename: (req, file, callback) => { callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); }

  }),

  fileFilter: (req, file, callback) => {
    let ext = path.extname(file.originalname)
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
      return callback(/*res.end('Only images are allowed')*/ null, false)
    }
    callback(null, true)
  }
});

let app = new express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('uploads'));

app.get('/', (req, res) => {
  Detail.find({}, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.render('index', { data: data });
    }
  })

});

app.post('/', upload.any(), (req, res) => {

  if (!req.body && !req.files) {
    res.json({ success: false });
  } else {
    let c;
    Detail.findOne({}, (err, data) => {

      if (data) {
        c = data.unique_id + 1;
      } else {
        c = 1;
      }

      let detail = new Detail({

        unique_id: c,
        Name: req.body.title,
        image1: req.files[0] && req.files[0].filename ? req.files[0].filename : '',
        image2: req.files[1] && req.files[1].filename ? req.files[1].filename : '',
      });

      detail.save((err, Person) => {
        if (err)
          console.log(err);
        else
          res.redirect('/');

      });

    }).sort({ _id: -1 }).limit(1);

  }
});

app.post('/delete', (req, res) => {

  Detail.findByIdAndRemove(req.body.prodId, (err, data) => {

    // console.log(data);
    // remove file from upload folder which is deleted
    fs.unlinkSync(`./uploads/${data.image1}`);
    fs.unlinkSync(`./uploads/${data.image2}`);

  })
  res.redirect('/');
});

let port = 2000;
app.listen(port, () => { console.log('listening on port ' + port); });