const csv = require('csvtojson')
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname,"..","public")))

const csvFilePath = path.join(__dirname,"..","inputFile.csv");


// Function to convert a string based date in a specific format into DATE object. 
function stringToDate(_date,_format,_delimiter)
{
            var formatLowerCase=_format.toLowerCase();
            var formatItems=formatLowerCase.split(_delimiter);
            var dateItems=_date.split(_delimiter);
            var monthIndex=formatItems.indexOf("mm");
            var dayIndex=formatItems.indexOf("dd");
            var yearIndex=formatItems.indexOf("yyyy");
            var month=parseInt(dateItems[monthIndex]);
            month-=1;
            var formatedDate = new Date(dateItems[yearIndex],month,dateItems[dayIndex]);
            return formatedDate;
}

app.post("/locations", (req,res)=>{
    const fd = stringToDate(req.body.fd,"MM/dd/yyyy","/").getTime();
    const td = stringToDate(req.body.td,"MM/dd/yyyy","/").getTime();
    if(td < fd){
        return res.send({error: "The \"TO\" date must be LARGER than \"FROM\" date"})
    }
    csv()
    .fromFile(csvFilePath)
    .then((arr)=>{
        let count = 0;
        let dates = [];
        let locations = [];
        let part = [];
        let first = true;
        let oldCardNumber;
        let firstOccurrences = [];
        arr.forEach((obj)=>{
            const newDate = obj.createdAt.split(" ");
            if(newDate.length === 2){
                let d = stringToDate(newDate[0],"MM/dd/yyyy","/").getTime();
                if((d>=fd) && (d<=td)){
                    count++;
                    if(dates.indexOf(obj.createdAt)===-1){
                        dates.push(obj.createdAt);
                    }
                    if((obj.cardNumber !== oldCardNumber) && (!first)){
                        locations.push(part);
                        part = [];
                        firstOccurrences.push(obj.createdAt);
                        oldCardNumber = obj.cardNumber;
                    }
                    if(first){
                        first = false;
                        firstOccurrences.push(obj.createdAt);
                        oldCardNumber = obj.cardNumber;
                    }
                    obj.lat = Number.parseFloat(obj.lat);
                    obj.long = Number.parseFloat(obj.long);
                    part.push(obj);
                }
            }
        })
        locations.push(part);
        
        if(count===0){
            return res.send({error: 'No relevant documents could be fetched for the given time interval.'})
        }
        // Sending lists of all locations, dates and first time occurrences of markers as response to client
        res.status(200).send({locations, dates, firstOccurrences});
    })
})

app.get("*", (req, res)=>{
    // Send the index.html file whenever any path other than the above mentioned API paths is seen by server.
    res.sendFile(path.join(__dirname,"..","public/index.html"));
})

app.listen(3000, ()=>{
    console.log("Listening at Port: 3000");
})




