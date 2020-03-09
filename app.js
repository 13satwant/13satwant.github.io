

let config = {
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

let firestore = firebase.firestore();

let map;
let items = [];
let filteredItems = [];
let country = new Set();
let city = new Set();
let locality = new Set();
let markers = [];
let wholeCollection = firestore.collection("ClinicCollection");
let table;
let queryFilter;
let oldMarker;

let countrySelected = [];
let citySelected = [];
let localitySelected = [];


google.charts.load('current', { 'packages': ['corechart', 'controls', 'table'] });


function cleanMenu(){
    jQuery('#country-select-menu').children().remove();
    jQuery('#city-select-menu').children().remove();
    jQuery('#locality-select-menu').children().remove();
}

function drawMenu() {
    // Everything is loaded. Assemble your dashboard...
    let countrySelect = jQuery('#country-select-menu');
    Array.from(country).forEach(value => {
        countrySelect.append('<div class="select-menu-item" data-value="' + value + '">' + value + '</div>');
    })

    let citySelect = jQuery('#city-select-menu');
    Array.from(city).forEach(value => {
        citySelect.append('<div class="select-menu-item" data-value="' + value + '">' + value + '</div>');
    })

    let localitySelect = jQuery('#locality-select-menu');
    Array.from(locality).forEach(value => {
        localitySelect.append('<div class="select-menu-item" data-value="' + value + '">' + value + '</div>');
    })
}

function openMenu(filter) {
    switch (filter) {
        case 'country':
            jQuery('#country-select-menu').toggle();
            jQuery('#city-select-menu').hide();
            jQuery('#locality-select-menu').hide();

            break;
        case 'city':
            jQuery('#city-select-menu').toggle();
            jQuery('#country-select-menu').hide();
            jQuery('#locality-select-menu').hide();
            break;
        case 'locality':
            jQuery('#locality-select-menu').toggle();
            jQuery('#country-select-menu').hide();
            jQuery('#city-select-menu').hide();
            break;

        default:
            break;
    }
}


async function filter(menu, e) {
    let itemTitle = e.target.dataset.value;
    switch (menu){
        case 'country':
            countrySelected.push(itemTitle);
            jQuery('#country-select .added').append("<div class='country-name'  data-value='"+itemTitle+"' >"+itemTitle+ "</div>");
            jQuery('#country-select-menu').toggle();
            jQuery('.country-name').on('click',function () {
                let itemName = jQuery(this).data('value');
                countrySelected = countrySelected.filter( e=> e !== itemName);
                console.log(countrySelected)
                jQuery(this).remove();
            });

            if(countrySelected.length==0){
                queryFilter = wholeCollection;
            }else if(countrySelected.length==1){
                queryFilter = wholeCollection.where('country', "==", countrySelected[0]);
            }else if(countrySelected.length > 1){
                queryFilter = wholeCollection.where('country', "in", countrySelected);
            }
            break;
        case 'city':
            citySelected.push(itemTitle);
            jQuery('#city-select .added').append("<div class='country-name'  data-value='"+itemTitle+"' >"+itemTitle+ "</div>");
            jQuery('#city-select-menu').toggle();
            if(citySelected.length==1){
                queryFilter = wholeCollection.where('city', "==", citySelected[0]);
            }else if(citySelected.length > 1){
                queryFilter = wholeCollection.where('city', "in", citySelected);
            }
            break;
        case 'locality':
            localitySelected.push(itemTitle);
            jQuery('#locality-select .added').append("<div class='country-name'  data-value='"+itemTitle+"' >"+itemTitle+ "</div>");
            jQuery('#locality-select-menu').toggle();
            if(localitySelected.length==1){
                queryFilter = wholeCollection.where('locality', "==", localitySelected[0]);
            }else if(localitySelected.length > 1){
                queryFilter = wholeCollection.where('locality', "in", localitySelected);
            }
            break;

        default:
            break;
    }

    city = new Set();
    locality = new Set();
    filteredItems = [];
    await queryFilter.get().then((snapshot) => {
        snapshot.docs.forEach(doc => {
            filteredItems.push(doc.data());
            city.add(doc.data().city);
            locality.add(doc.data().locality);
        });
    });
    debugger
    drawTable(filteredItems);
    cleanMenu();
    drawMenu();
}


const getRealtimeUpdate = () => {
    wholeCollection.onSnapshot((doc) => {
        if (doc && doc.exists) {
            items.push(doc.data());
        }
    });
    drawTable(items);
}

function fetchData(listener){
    wholeCollection.get().then((snapshot) => {
        snapshot.docs.forEach(doc => {
                items.push(doc.data());
                country.add(doc.data().formatted_country);
                city.add(doc.data().city);
                locality.add(doc.data().locality);
                let lon = parseInt(doc.data().coords.split(",")[0]);
                let lat = parseInt(doc.data().coords.split(",")[1]);
                let myLatlng = new google.maps.LatLng(lon, lat);

                let marker = new google.maps.Marker({
                    position: myLatlng,
                    map: map
                });
                let infowindow = new google.maps.InfoWindow({
                    content:
                        '<table class="clinicAddr">'
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
                }, false);

                marker.addListener('click', () => {
                    infowindow.open(marker.get('map'), marker);
                    mark = this;
                });
                markers.push(marker);
                marker.setMap(map);
            },
        );
        let markerCluster = new MarkerClusterer(map, markers, { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' });
        console.log(items);
        drawTable(items);
        drawMenu();
    });
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
}
function drawTable(tableData) {
    let data = new google.visualization.DataTable({
        cols: [
            {id: 'country', label:  'Country/Territory', type: 'string'},
            {id: 'city', label: 'City', type: 'string'},
            {id: 'locality', label: 'Locality', type: 'string'},
            {id: 'clinic_name', label: 'Clinic name', type: 'string'},
            {id: 'address', label: 'Adress', type: 'string'},
            {id: 'phone', label: 'Phone', type: 'string'},
            {id: 'size', label: 'Size', type: 'string'},
        ],
    });

    tableData.forEach((value, key) => {
        data.addRows([
            [value.formatted_country.toString(), value.city.toString(), value.locality.toString(), value.clinic_name.toString(), value.full_address.toString(), value.phone.toString(), value.size.toString()]
        ]);
    })
    table = new google.visualization.Table(document.getElementById('fulltable'));
    debugger

    table.draw(data, { showRowNumber: false, page: 'enabled', pageSize: 15, width: '100%', height: '100%', pagingButtons: 'prev' && 'next' });

}


function clickTable(e) {

    let red = table.getSelection();
    // console.log(table.getSelection())
    console.log(parseInt(table.getTableProperties));
    debugger
    return red;
}
initMap();
fetchData();
getRealtimeUpdate();