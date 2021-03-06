/**
 * Created by Hadeel on 11/8/15.
 */
var years;


function barVis(_parentElement, allData, _eventHandler,mapSelectionChanged,reset,chartID) {


    var self = this;
    self.parentElement = _parentElement;
    self.displayData = allData;
    self.eventHandler = _eventHandler;
    //console.log(self.parentElement);
    //self.parent = parentObject;

    self.initVis();

}

// now we init the variables, scales, etc.

barVis.prototype.initVis = function () {


    var self = this; // read about the this
    self.graphH= 1000;
    self.graphW= 420;

    self.svg = d3.select(self.parentElement).select("svg");

    self.parksnames = self.displayData.map(function(d) { return d.ParkName; });

    //self.yScale = d3.scale.ordinal().rangeRoundBands([0, self.graphH], 0.1).domain(self.parksnames);


    self.xScale = d3.scale.linear().range([ 0,self.graphW]);

    self.yScale = d3.scale.ordinal().rangeBands([0, self.graphH], 0.1).domain(self.parksnames);

    // self.yScale = d3.scale.linear().range([self.graphH, 0]);

    //self.xAxis = d3.svg.axis().scale(self.xScale);

    self.xAxis = d3.svg.axis().scale(self.xScale).orient("top").ticks(20)
        .tickFormat(d3.format("s"));

    //self.yAxis = d3.svg.axis().scale(self.yScale).orient("left");
    self.yAxis = d3.svg.axis().scale(self.yScale).orient("left").ticks(1);


    // visual elements
    self.visG = self.svg.append("g").attr({
        "transform": "translate(" + 180 + "," + 30 + ")"
    });

    // xScale and xAxis stays constant:
    // copied from http://bl.ocks.org/mbostock/4403522
    self.visG.append("g")
        .attr("class", "yAxis axis")
        .attr("transform", "translate(0," +80  + ")")
        .call(self.yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 10)
        .attr("x", -15) // magic number
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("parks")
        .selectAll("text")
        .attr("y", 10) // magic number
        .attr("x", -15) // magic number
        .attr("transform", "rotate(45)")
        .style("text-anchor", "end")
        .text(function (d,i) {
            return self.parksnames[i];
        });

    self.visG.append("g")
        .attr("class", "xAxis axis")
        .call(self.xAxis)
        .attr("transform", "translate(0," +31  + ")")
        .selectAll("text")
        //.attr("transform", "rotate(-45)")
        .style("text-anchor", "start");

    self.visG.append("g")
        .attr("class", "barBox")
        .attr("transform", "translate(0," +25  + ")");

    self.updateVis();
    //self.setup();
};

barVis.prototype.filterData = function () {

    var self = this;

    var newDisplayData = [];
    var selectedParkCodes = [];
    for(i = 0; i < SelectedParks.length; i++)
    {
        selectedParkCodes.push(ParkSelectionByName[SelectedParks[i]])
    }
    //console.log(SelectedParks)
    //console.log(selectedParkCodes);


    for(i = 0; i < allData.length; i ++)
    {
        var pname = allData[i]["ParkName"];
        //console.log(pname)
        for(j = 0; j < selectedParkCodes.length; j++)
        {
            if(pname.valueOf() == selectedParkCodes[j].valueOf())
                newDisplayData.push(allData[i]);
        }
    }

    //console.log(allData)
    //console.log(newDisplayData);

    self.displayData = newDisplayData;

}

barVis.prototype.updateVis = function () {


    var self = this;

    ////////////////////////////////////////////////////////////
    ////////Analyze data to make sure it includes the selected month and or year
    ////////////////////////////////////////////////////////////

    self.filterData();

    var deleteBars = d3.selectAll(".bar").remove();
    var deleteTips = d3.selectAll(".d3-tip").remove();

    if(MonthMode == 0)
        self.m=10000000;
    else
        self.m=d3.max(self.displayData, function (d, i) {
            var vex = 0;
            try{
                vex = parseInt(self.displayData[i]["MonthlyData"][SelectedYear][SelectedMonth]);
            }catch (err)
            {
                //Generate fake data becasue this park was missing it
                //console.log("error with park " + self.displayData[i]["ParkName"])
                //return 0;
            }
                if(isNaN(vex))
                    return 0;
                else
                    return vex;
            });


    var minMaxY = [0, self.m];
    //console.log(minMaxY);
    self.parksnames = self.displayData.map(function(d) { return NameSelectionByCode[d.ParkName]; });

    //having the maximum value for monthly view
    colorScale = d3.scale.linear().domain(minMaxY).range(["#a6bddb","#2b8cbe"]);


    // Y Scale and X Scale
    self.yScale = d3.scale.ordinal().rangeRoundBands([0, self.graphH], 0.1).domain(self.parksnames);
    self.yAxis = d3.svg.axis().scale(self.yScale).ticks(1);
    self.yAxis.orient("left");

    self.xScale.domain(minMaxY);
    self.xAxis.scale(self.xScale).ticks(20)
        .tickFormat(d3.format("s"));

    // draw the scales :
    self.visG.select(".xAxis")
        .call(self.xAxis)
        .selectAll("text")
        .attr("x", 10)
        .attr("y", 0)
        .attr("transform", "rotate(-65)" )
        .style("text-anchor", "start");

    ///Remove the x axis cause its being unfriendly to the vis
    self.visG.select(".yAxis").remove();

    //Draw it again
    self.visG.append("g")
        .attr("class", "yAxis axis")
        .attr("transform", "translate(0," + 30 + ")")
        .call(self.yAxis)
        .selectAll("text")
        .attr("y", -5) // magic number
        .attr("x", -15) // magic number
        //.attr("transform", "rotate(45)")
        .style("text-anchor", "end")
        .text(function (d,i) {
            return self.parksnames[i];
        });


    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d)
        {
            if(MonthMode == 0)
            return "<strong>Park name</strong> <span style='color:red'>" + NameSelectionByCode[d.ParkName]
                + "</span>"+"<br>" + "<strong>" + SelectedYear + " Annual Visits:</strong> <span style='color:red'>" + d["YearlyData"][SelectedYear]+ "</span>";

            else
            {
                return "<strong>Park name</strong> <span style='color:red'>" + NameSelectionByCode[d.ParkName]
                    + "</span>"+"<br>" + "<strong>" + SelectedYear + " " + MonthsByNumber[SelectedMonth] + "  Visits:</strong> <span style='color:red'>" + d["MonthlyData"][SelectedYear][SelectedMonth]+ "</span>";
            }

        });

    // draw the bars :

    var bars = self.visG.select(".barBox").selectAll(".bar").data(self.displayData);

    bars.exit().remove();

    bars.enter().append("rect")
        .attr({
            "class": "bar",
            "height": self.yScale.rangeBand(),
            "y": function (d, i) {
                return self.yScale(self.parksnames[i])

            }
        });
    bars.call(tip);
    bars.attr({
        "width": function (d,i) {
            //return self.graphH -self.yScale(self.years[i][self.yearselected]);
            var width = 0;

            if (MonthMode == 0)
                width = parseInt(self.displayData[i]["YearlyData"][SelectedYear]);
            else {
                try {
                    width = parseInt(self.displayData[i]["MonthlyData"][SelectedYear][SelectedMonth]);
                } catch (err) {
                    //console.log("error with park " + self.displayData[i]["ParkName"])
                    //return 0;
                }
            }

            if(!isNaN((width)))
                return self.xScale(width);
            else
                return self.xScale(0);
        },
        "x": function () {
            /*//x = self.xScale(self.displayData[i]["YearlyData"][SelectedYear]);
            x = self.xScale(0);
            if(!isNaN((x)))
                return x;
            else*/
                return 0;
        }

    });


    bars.style("fill", function (d,i){
        if(MonthMode == 0)

            if(d["ParkName"] != ActivitiesPark)
                return colorScale(self.displayData[i]["YearlyData"][SelectedYear]);
            else
                return "#DF7E7B";


        else
        {
            var value = 0;

            if (MonthMode == 0)
                value = parseInt(self.displayData[i]["YearlyData"][SelectedYear]);
            else {
                try {
                    value = parseInt(self.displayData[i]["MonthlyData"][SelectedYear][SelectedMonth]);
                } catch (err) {

                    //console.log("error with park " + self.displayData[i]["ParkName"])
                    //return 0;
                }
            }
            if(!isNaN((value)))
            {
                if(d["ParkName"] != ActivitiesPark)
                    return colorScale(value);
                else
                    return "#DF7E7B";
            }

            else
            {
                if(d["ParkName"] != ActivitiesPark)
                    return colorScale(0);
                else
                    return "#DF7E7B";
            }

        }
    });

    bars.on('mouseover', tip.show);
    bars.on('mouseout', tip.hide);
    bars.on("click", function (d)
    {
        //console.log("clicked a bar for " + NameSelectionByCode[d["ParkName"]]);
        self.eventHandler(d["ParkName"]);
    });

    self.setup();
};

// This is an old function for the old slider, we don't need it now

barVis.prototype.setup = function () {

    var self = this;

    /*
    d3.select('#slider').on('change', function () {
        self.initVis(this.value);
        self.updateVis();

        //console.log("this.value");

    });*/

}