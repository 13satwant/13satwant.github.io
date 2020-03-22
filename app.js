

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
let viewMark = null;
let pageNumber = 1;
let wholeCollection = firestore.collection("ClinicCollection");
let table;
let queryFilter;
let oldMarker;
let sliderNum = 0;

let countrySelected = [];
let citySelected = [];
let localitySelected = [];


google.charts.load('45', { 'packages': ['corechart', 'controls', 'table'] });


function cleanMenu(){
    jQuery('#country-select-menu').children().remove();
    jQuery('#city-select-menu').children().remove();
    jQuery('#locality-select-menu').children().remove();
}

function drawMenu() {
    // Everything is loaded. Assemble your dashboard...
    let countrySelect = jQuery('#country-select-menu');
    Array.from(country).forEach(value => {
        wholeCollection.where('country', "==", value).get().then((snapshot) => {
            countrySelect.append('<div class="select-menu-item" data-value="' + value + '">' + value + '(' + snapshot.docs.length + ') </div>');
        })
    })

    let citySelect = jQuery('#city-select-menu');
    Array.from(city).forEach(value => {
        wholeCollection.where('city', "==", value).get().then((snapshot) => {
            citySelect.append('<div class="select-menu-item" data-value="' + value + '">' + value + '(' + snapshot.docs.length + ') </div>');
        })
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
            jQuery('#country-select .added').append("<div class='country-name' data-value='"+itemTitle+"' ><span data-value='"+itemTitle+"' data-type='country'>&#10006</span>"+itemTitle+ "</div>");
            jQuery('#country-select-menu').toggle();

            if(countrySelected.length == 0){
                queryFilter = wholeCollection;
            }else if(countrySelected.length == 1){
                queryFilter = wholeCollection.where('country', "==", countrySelected[0]);
            }else if(countrySelected.length > 1){
                queryFilter = wholeCollection.where('country', "in", countrySelected);
            }
            break;
        case 'city':
            citySelected.push(itemTitle);
            jQuery('#city-select .added').append("<div class='country-name' data-value='"+itemTitle+"' ><span data-value='"+itemTitle+"' data-type='city'>&#10006</span>"+itemTitle+ "</div>");
            jQuery('#city-select-menu').toggle();
            if(citySelected.length==1){
                queryFilter = wholeCollection.where('city', "==", citySelected[0]);
            }else if(citySelected.length > 1){
                queryFilter = wholeCollection.where('city', "in", citySelected);
            }
            break;
        case 'locality':
            localitySelected.push(itemTitle);
            jQuery('#locality-select .added').append("<div class='country-name' data-value='"+itemTitle+"' ><span data-value='"+itemTitle+"' data-type='city'>&#10006</span>"+itemTitle+ "</div>");
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
    var location = [];
    for(var i = 0; i < filteredItems.length; i++){
        let lon = parseInt(filteredItems[i].coords.split(",")[0]);
        let lat = parseInt(filteredItems[i].coords.split(",")[1]);
        
        if(!isNaN(lon) && !isNaN(lat)){
            location.push({name: filteredItems[i].city, latlng: new google.maps.LatLng(lon, lat)})
        }
    }
    jQuery('.country-name span').on('click',async function () {
        let itemName = jQuery(this).data('value');
        countrySelected = countrySelected.filter( e=> e !== itemName);
        if(jQuery(this).data('type') == 'country'){
            jQuery('#city-select-menu').next().children().remove();
            jQuery('#locality-select-menu').next().children().remove();
        }
        if(jQuery(this).data('type') == 'city'){
            jQuery('#locality-select-menu').next().children().remove();
        }
        jQuery(this).parent().remove();
        
        if(countrySelected.length == 0){
            queryFilter = wholeCollection;
        }else if(countrySelected.length == 1){
            queryFilter = wholeCollection.where('country', "==", countrySelected[0]);
        }else if(countrySelected.length > 1){
            queryFilter = wholeCollection.where('country', "in", countrySelected);
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
        var location = [];
        for(var i = 0; i < filteredItems.length; i++){
            let lon = parseInt(filteredItems[i].coords.split(",")[0]);
            let lat = parseInt(filteredItems[i].coords.split(",")[1]);
            
            if(!isNaN(lon) && !isNaN(lat)){
                location.push({name: filteredItems[i].city, latlng: new google.maps.LatLng(lon, lat)})
            }
        }
        BoundChange(location);
        drawTable(filteredItems);
        cleanMenu();
        drawMenu();
    });
    BoundChange(location);
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
                    title: JSON.stringify(doc.data()),
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
                    sliderNum = 0;
                    infowindow.open(marker.get('map'), marker);
                    mark = this;
                });
                markers.push(marker);
                marker.setMap(map);
            },
        );
        let markerCluster = new MarkerClusterer(map, markers, { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',averageCenter: false });
        // var markerCluster = new MarkerClusterer(map, markers, {
        //   averageCenter: false
        // });        
        markerCluster.addListener('click', (cluster, event) => {
            sliderNum = 0;
            var flg = false;
            let lon = parseInt(JSON.parse(cluster.markers_[0].title).coords.split(",")[0]);
            let lat = parseInt(JSON.parse(cluster.markers_[0].title).coords.split(",")[1]);
            var prevMark = lon+", "+lat;
            var i = 0;
            var lenght_i = cluster.markers_.length
            var content = '<div class="slider">';
            content += '<div class="slider-button">'
                    + '<div class="slick-next">&#10094</div>'
                    + '<p class="slick-number">' + (sliderNum+1) + " / " + cluster.markers_.length + '</p>'
                    + '<div class="slick-prev">&#10095</div>'
                    + '</div>'
            for (i; i < cluster.markers_.length; i++) {
                var markerdata = JSON.parse(cluster.markers_[i].title);
                lon = parseInt(JSON.parse(cluster.markers_[i].title).coords.split(",")[0]);
                lat = parseInt(JSON.parse(cluster.markers_[i].title).coords.split(",")[1]);
                if(prevMark !== lon+", "+lat){
                    flg = true;
                }
                prevMark = lon+", "+lat;
                content += '<table class="clinicAddr table">'
                        +'<tbody>'
                        + '<tr class="tableRow">'
                        + '<td class="infos"><b>Clinic</b></td>'
                        + '<td>' + markerdata.clinic_name + '</td>'
                        + '</tr>'
                        + '<tr>'
                        + '<td class="infos"><b>Address</b></td>'
                        + '<td>' + markerdata.full_address + '</td>'
                        + '</tr>'
                        + '<tr>'
                        + '<td class="infos"><b>Capacity</b></td>'
                        + '<td>' + markerdata.capacity + '</td>'
                        + '</tr>'
                        + '<tr>'
                        + '<td class="infos"><b>Phone</b></td>'
                        + '<td>' + markerdata.phone + '</td>'
                        + '</tr>'
                        + '<tr>'
                        + '<td class="infos"><b>Size</b></td>'
                        + '<td>' + markerdata.size + '</td>'
                        + '</tr>'
                        + '<tr>'
                        + '<td class="infos"><b>Clinic Needs</b></td>'
                        + '<td>' + markerdata.we_require + '</td>'
                        + '</tr>'
                        + '</tbody>'
                        + '</table>';
            }
            content += "</div>";
            // var compiled = $compile(content)($scope);
            var infoWindow = new google.maps.InfoWindow({
                content : content,
                position : cluster.getCenter()
            });
            if(!flg){
                infoWindow.open(map);
                google.maps.event.addListener(infoWindow,'domready',function() {
                    var t = jQuery('.table');
                    t[0].style.display = 'block'
                    jQuery('.slick-prev').click(function(){

                        if(sliderNum < lenght_i-1){
                            t[sliderNum].style.display = 'none';
                            sliderNum++;
                            t[sliderNum].style.display = 'block';
                            jQuery('.slick-number').text((sliderNum+1) + " / " + lenght_i)
                        }
                        
                    })
                    jQuery('.slick-next').click(function(){

                        if(sliderNum > 0){
                            console.log(sliderNum, lenght_i)
                            t[sliderNum].style.display = 'none';
                            sliderNum--;
                            t[sliderNum].style.display = 'block';
                            jQuery('.slick-number').text((sliderNum+1) + " / " + lenght_i)
                        }
                        
                    })
                });
            }
            
        });
        country = Array.from(country).sort();
        city = Array.from(city).sort();
        locality = Array.from(locality).sort();
        // console.log("asdasdsa",items);
        filteredItems = items;
        drawTable(items);
        drawMenu();
    });
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
}
function BoundChange(location) {

    var bounds = new google.maps.LatLngBounds();
    for(var i = 0; i < location.length; i++){
        bounds.extend(location[i].latlng);
    }
    map.fitBounds(bounds)
}
function titleView(i, item) {
    if(viewMark !== null){
        viewMark.setMap(null);
    }
    let lon = parseInt(item.coords.split(",")[0]);
    let lat = parseInt(item.coords.split(",")[1]);
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
            + '<td>' + item.clinic_name + '</td>'
            + '</tr>'
            + '<tr>'
            + '<td class="infos"><b>Address</b></td>'
            + '<td>' + item.full_address + '</td>'
            + '</tr>'
            + '<tr>'
            + '<td class="infos"><b>Capacity</b></td>'
            + '<td>' + item.capacity + '</td>'
            + '</tr>'
            + '<tr>'
            + '<td class="infos"><b>Phone</b></td>'
            + '<td>' + item.phone + '</td>'
            + '</tr>'
            + '<tr>'
            + '<td class="infos"><b>Size</b></td>'
            + '<td>' + item.size + '</td>'
            + '</tr>'
            + '<tr>'
            + '<td class="infos"><b>Clinic Needs</b></td>'
            + '<td>' + item.we_require + '</td>'
            + '</tr>'
            + '</tbody>'
            + '</table>'
    }, false);
    infowindow.open(marker.get('map'), marker);
    google.maps.event.addListener(infowindow,'closeclick',function(){
       viewMark.setMap(null); //removes the marker
       // then, remove the infowindows name from the array
       viewMark = null;
    });
    viewMark = marker;
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

    table.draw(data, { 
        page: 'event', 
        pageSize: 15, 
        width: '100%', 
        height: '100%',
        pagingSymbols: {
            prev: '<',
            next: '>'
        },
        pagingButtons: "auto"
    });
    google.visualization.events.addListener(table, 'select', function(e){
        let red = table.getSelection();
        titleView(red[0].row, filteredItems[red[0].row]);
    });
    google.visualization.events.addListener(table, 'page', myPageEventHandler);
    var text = (pageNumber-1)*15+1+" - "+pageNumber*15+" / "+filteredItems.length;
    pageNumber = 1;
    if(pageNumber*15 > filteredItems.length){
        text = (pageNumber-1)*15+1+" - "+filteredItems.length+" / "+filteredItems.length;
    }
    jQuery('.google-visualization-table-div-page').append("<div class='page-number' >"+text+ "</div>");
    
}
function myPageEventHandler(e) {
    pageNumber = parseInt(e['page'])+1;
    console.log(pageNumber);
    var text = (pageNumber-1)*15+1+" - "+pageNumber*15+" / "+filteredItems.length;
    if(pageNumber*15 > filteredItems.length){
        text = (pageNumber-1)*15+1+" - "+filteredItems.length+" / "+filteredItems.length;
    }
    jQuery('.google-visualization-table-div-page').append("<div class='page-number' >"+text+ "</div>");
}

function clickTable(e) {
    let red = table.getSelection();
    return red;
}
initMap();
fetchData();
getRealtimeUpdate();
