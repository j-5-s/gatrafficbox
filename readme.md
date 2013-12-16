# GA Trafficbox

![box](http://gatrafficbox.aws.af.cm/images/box.jpg)

This was a quick project I put together for RobotConf 2013 using a Spark Core device. It uses the Real Time
Google Analytics API to send data to your Spark device which will then turn a Servo from 0 to 180 degrees 
to represent the number of people on your website.

It relies on a running Node.JS server to communicate between Google Analytics and the Spark Device. You can get
free and paid hosting on the App Fog, Heroku, or Joyent. 


## Demo
TODO, add youtube link

## Materials Needed
- [Spark Core Device](http://spark.io/)
- [Servo](https://www.sparkfun.com/search/results?term=servo&what=products) (Any kind should do)
- [Jumper Wires](https://www.sparkfun.com/products/124)
- [Breadboard](https://www.sparkfun.com/categories/149)


## Building the Box

Its up to you to create a cooler box than the laser engraved one I got made at RobotsConf by .
All you need to do is get the Servo turning and you can do whatever you want as far as design goes.



## Installing the Web App

### Install locally
```text
npm install gatrafficbox
```

### Push to PAAS Cloud
Most PAAS have good CLI tools to deploy code, so checkout their doc, its a bit beyond this app.
### Example using App fog.
```text
sudo gem install af
af login
ap update <name>
```



