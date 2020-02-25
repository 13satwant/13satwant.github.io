var config = {
  apiKey: "AIzaSyBB6JyfIq0QO-W3JE6mqaHJoi8CQdBX1Ew",
  authDomain: "njt-notjusttourists.firebaseapp.com",
  databaseURL: "https://njt-notjusttourists.firebaseio.com",
  projectId: "njt-notjusttourists",
  storageBucket: "njt-notjusttourists.appspot.com",
  messagingSenderId: "343973965706",
  appId: "1:343973965706:web:cd0cc5d3f7c0a0b2496273",
  measurementId: "G-BGHVZYZWXH"
};

let mapOptions = {
  center: { lat: 0, lng: 0 },
  zoom: 2,
  styles: [{
    featureType: 'poi',
    stylers: [{ visibility: 'off' }]  // Turn off POI.
  },
  {
    featureType: 'transit.station',
    stylers: [{ visibility: 'off' }]  // Turn off bus, train stations etc.
  }],
  disableDoubleClickZoom: true,
  streetViewControl: false,
}


firebase.initializeApp(config);

var firestore = firebase.firestore();


let items = [];
let country = new Set();
let city = new Set();
let locality = [];
let markers = [];
let wholeCollection = firestore.collection("ClinicCollection");


let countrySelected = [];
let citySelected = [];
let localitySelected = [];


google.charts.load('current', { 'packages': ['corechart', 'controls', 'table'] });
google.charts.setOnLoadCallback(drawTable);
google.charts.setOnLoadCallback(drawDashboard);

function drawDashboard() {
  // Everything is loaded. Assemble your dashboard...
  debugger
  var countrySelect = document.getElementById('country-select');
  // var data = Array.from(country);
  // data.forEach((value,key) => {});

  var programmaticSlider = new google.visualization.ControlWrapper({
    'controlType': 'CategoryFilter',
    'containerId': 'countryselect',
    'options': {
      'filterColumnLabel': 'Donuts eaten',
      'ui': {'labelStacking': 'vertical'}
    }
  });
  programmaticSlider.draw(data);
  console.log(data);
}

const getRealtimeUpdate = () => {
  wholeCollection.onSnapshot((doc) => {
    if (doc && doc.exists) {
      items.push(doc.data());

    }
  });
}

function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), mapOptions);
  debugger
  wholeCollection.get().then((snapshot) => {
    snapshot.docs.forEach(doc => {
      items.push(doc.data());
      country.add(doc.data().country);
      city.add(doc.data().city);
      var lon = parseInt(doc.data().coords.split(",")[0]);
      var lat = parseInt(doc.data().coords.split(",")[1]);
      var myLatlng = new google.maps.LatLng(lon, lat);

      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map
      });

      var infowindow = new google.maps.InfoWindow({
        content:
          '<table class="clinicAddr">' +
          +'<tbody>'
          + '<tr class="tableRow">'
          + '<td class="infos"><b>Clinic</b></td>'
          + '<td>' + doc.data().clinic_name + '</td>'
          + '</tr>'
          + '<tr>'
          + '<td class="infos"><b>Address</b></td>'
          + '<td>' + doc.data().full_address + '</td>'
          + '</tr>'
          + '<tr>'
          + '<td class="infos"><b>Capacity</b></td>'
          + '<td>' + doc.data().capacity + '</td>'
          + '</tr>'
          + '<tr>'
          + '<td class="infos"><b>Phone</b></td>'
          + '<td>' + doc.data().phone + '</td>'
          + '</tr>'
          + '<tr>'
          + '<td class="infos"><b>Size</b></td>'
          + '<td>' + doc.data().size + '</td>'
          + '</tr>'
          + '<tr>'
          + '<td class="infos"><b>Clinic Needs</b></td>'
          + '<td>' + doc.data().we_require + '</td>'
          + '</tr>'
          + '</tbody>'
          + '</table>'
      });

      marker.addListener('click', () => {
        infowindow.open(marker.get('map'), marker);
      });

      markers.push(marker);
      marker.setMap(map);
    },
    );
    var markerCluster = new MarkerClusterer(map, markers, { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' });

    drawTable();
    drawDashboard();
  });
}


function drawTable() {
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Country/Territory');
  data.addColumn('string', 'City');
  data.addColumn('string', 'Locality');
  data.addColumn('string', 'Clinic name');
  data.addColumn('string', 'Adress');
  data.addColumn('string', 'Phone');
  data.addColumn('string', 'Size');

  items.forEach((value, key) => {
    data.addRows([
      [value.country.toString(), value.city.toString(), value.locality.toString(), value.clinic_name.toString(), value.full_address.toString(), value.phone.toString(), value.size.toString()]
    ]);
  })
  var table = new google.visualization.Table(document.getElementById('fulltable'));

  table.draw(data, { showRowNumber: false, page: 'enabled', pageSize: 15, width: '100%', height: '100%', pagingButtons: 'prev' && 'next' });
}

getRealtimeUpdate();