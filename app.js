const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const request = require("request");
const client = require("@mailchimp/mailchimp_marketing");
const https = require("https");
const dotenv = require("dotenv").config();

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

const myApiKey = process.env.API_KEY;

client.setConfig({
  apiKey: myApiKey,
  server: "us6",
});

mongoose.connect(`mongodb+srv://${process.env.username}:${process.env.password}@cluster0.nfemt.mongodb.net/BlogDB?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const postSchema = {
  title: String,
  image: String,
  content: String
};

const Post = mongoose.model("Post", postSchema);

app.get("/", function (req, res) {
  Post.find({}, function (err, posts) {
    res.render("home", {
      homeStartingContent: homeStartingContent,
      posts: posts
    });
  })
});

app.get("/about", function (req, res) {
  res.render("about", {
    aboutContent: aboutContent
  });
});

app.get("/contact", function (req, res) {
  res.render("contact", {
    contactContent: contactContent
  });
});

app.get("/signup", function (req, res) {
  res.sendFile(__dirname + "/public/html/signup.html");
});

app.get("/success", function (req, res) {
  res.sendFile(__dirname + "/public/html/success.html");
});

app.get("/failure", function (req, res) {
  res.sendFile(__dirname + "/public/html/failure.html");
});

app.get("/compose", function (req, res) {
  res.render("compose");
});


app.post("/compose", function (req, res) {
  const post = new Post({
    title: req.body.postTitle,
    image: req.body.image,
    content: req.body.postBody
  });

  post.save(function (err) {
    if (!err) {
      res.redirect("/");
    }
  });
});


app.get("/posts/:postId", function (req, res) {
  const requestedPostId = req.params.postId;

  Post.findOne({
    _id: requestedPostId
  }, function (err, post) {
    if (!err) {
      res.render("post", {
        title: post.title,
        image: post.image,
        content: post.content
      });
    } else {
      console.log("Post not found");
    }
  });

});

app.post("/failure", function (req, res) {
  res.redirect("/signup");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});


app.post("/signup", function (req, res) {
  const firstName = req.body.fName;
  const lastName = req.body.lName;
  const email = req.body.email;

  const subscribingUser = {
    firstName: firstName,
    lastName: lastName,
    email: email
  }

  const run = async () => {
    try {
      const response = await client.lists.addListMember("e5e66d163f", {
        email_address: subscribingUser.email,
        status: "subscribed",
        merge_fields: {
          FNAME: subscribingUser.firstName,
          LNAME: subscribingUser.lastName
        }
      });
      console.log(response);
      res.sendFile(__dirname + "/public/html/success.html");
    } catch (error) {
      console.log(error);
      res.sendFile(__dirname + "/public/html/failure.html");
    }
  };

  run();
});