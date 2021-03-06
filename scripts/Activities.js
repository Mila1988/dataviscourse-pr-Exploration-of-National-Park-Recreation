//Bubblechart.js
//Created by Tony Niven: 11/22/15

function ActivitiesVis(_parentPane,_defaultData,_eventHandler)
{
    var self = this;

    self.parentPane = _parentPane;
    self.currentData = _defaultData;
    self.displayData = _defaultData;
    self.eventHandler = _eventHandler;
    self.enabled = true;
    self.wasEnabled = true;

    var selection = d3.selectAll(_parentPane);

    self.width = selection.attr("width");
    self.height = selection.attr("height");

    self.updateVis();
}

ActivitiesVis.prototype.initVis = function ()
{


    var self = this;


    //  the tooltips

    var deleteTips = d3.select(self.parentPane).selectAll(".axis").remove();
    var deleteTips = d3.select(self.parentPane).selectAll(".barBox").remove();
    var deleteTops = d3.select(self.parentPane).select(".noChartText").remove();


    self.topMargin = 40;
    self.translate = 250;
    self.yTrans = -20;


    self.graphW = d3.select(self.parentPane).attr("width")-50;
    self.graphH = d3.select(self.parentPane).attr("height") - self.topMargin;

    self.svg = d3.select(self.parentPane);

// setting up the X scale and X axis

    self.xScale = d3.scale.linear()
        .range([ 0,self.graphW - self.translate]);
    self.xAxis = d3.svg.axis()
        .scale(self.xScale)
        .orient("top")
        .ticks(20)
        .tickFormat("");

    self.parksnames = self.displayData.map(function(d) { return NameSelectionByCode[d.ParkName]; });

    // setting up the Y scale and Y axis

    self.yScale = d3.scale.ordinal()
        .rangeBands([0, self.graphH], 0.1)
        .domain(self.parksnames);

    self.yAxis = d3.svg.axis()
        .scale(self.yScale)
        .orient("left")
        .ticks(1);

    // visual elements
    self.visG = self.svg.append("g").attr({
        "transform": "translate(" + 250 + "," + 70 + ")"
    });

    // xScale and xAxis stays constant:
    // copied from http://bl.ocks.org/mbostock/4403522
    self.visG.append("g")
        .attr("class", "yAxis axis")
        .attr("transform", "translate(0," +  self.yTrans + ")")
        .call(self.yAxis)
        .selectAll("text")
        .style("fontSize","3px")
        .attr("y", 0) // magic number
        .attr("x", -15) // magic number
        .style("text-anchor", "end")
        .text(function (d,i) {
            return self.parksnames[i];
        });

    self.visG.append("g")
        .attr("class", "xAxis axis")
        .call(self.xAxis)
        .attr("transform", "translate(0," +self.yTrans + ")")
        //.attr("transform", "rotate(-45)")
        .selectAll("text")
        //.attr("transform", "rotate(-45)")
        .style("text-anchor", "start");

    self.visG.append("g")
        .attr("class", "barBox")
        .attr("transform", "translate(0," +( self.yTrans - 5) + ")");

    self.drawVis();
};

ActivitiesVis.prototype.filterData = function () {

    var self = this;

    /////////////////////////////////////////////////////////////////
    ///Step 1 - filter out the parks we dont want to look at
    /////////////////////////////////////////////////////////////////

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


    var step1DisplayData = newDisplayData;
    //console.log(step1DisplayData);
    /////////////////////////////////////////////////////////////////////
    ///Step 2 - Aggregate for the parks we want to look at
    /////////////////////////////////////////////////////////////////////

    var sampleData;
    var parkActivityData = [];
    var step2DisplayData = [];
    var sampleHeader = null;

    //console.log(step1DisplayData)
    for(p = 0; p < step1DisplayData.length; p++)
    {
        parkActivityData = [];

        if(MonthMode == 0)
        {
            sampleData = step1DisplayData[p]["ActivityData"][SelectedYear];

            if(sampleHeader == null)
                sampleHeader = step1DisplayData[p]["ActivityDataHeader"];

            var activityCounts =[0,0,0,0,0,0,0,0,0];

            for( j = 1; j < 13; j++ )
            {
                //console.log(MonthsByNumber[j])
                for( i = 0 ; i < sampleHeader.length; i++)
                {
                    if (sampleHeader[i] != "RecreationVisitors") {
                        try{
                            activityCounts[i] += parseInt(sampleData[j][i]);
                        }catch(err){
                            activityCounts[i] += 0;
                        }

                    }
                }
            }

            for( i = 0 ; i < sampleHeader.length; i++) {
                if (sampleHeader[i] != "RecreationVisitors") {

                    parkActivityData.push
                    ({
                        ActivityType: sampleHeader[i],
                        count: activityCounts[i]
                    });
                }
            }
        }
        else {
            try {

                sampleData = step1DisplayData[p]["ActivityData"][SelectedYear][SelectedMonth];

                if (sampleHeader == null)
                    sampleHeader = step1DisplayData[p]["ActivityDataHeader"];

                for (i = 0; i < sampleHeader.length; i++) {
                    if (sampleHeader[i] != "RecreationVisitors") {

                        parkActivityData.push
                        ({
                            ActivityType: sampleHeader[i],
                            count: parseInt(sampleData[i]),
                        });
                    }
                }
            }
            //This park did not have this data
            catch(err)
            {
                parkActivityData.push
                ({
                    ActivityType: sampleHeader[i],
                    count: 0
                });
            }
        }

        step2DisplayData.push
        ({
            ParkName:step1DisplayData[p]["ParkName"],
            ActivityData:parkActivityData,
        });



    }

    //console.log(step2DisplayData);
    self.displayData = step2DisplayData;

}


//Example version of this code is from: http://bl.ocks.org/mbostock/4063269

ActivitiesVis.prototype.drawVis = function(dataDraw)
{
    var self = this;


        self.filterData();

        var deleteBars = d3.selectAll(".compareBar").remove();
        var deleteTips = d3.selectAll(".d3-tip3").remove();

        self.m=d3.max(self.displayData, function (d, i) {

                return self.displayData[i]["ActivityData"][IndexByActivity[SelectedActitiy]]["count"]

        });


        var minMaxY = [0, self.m];

        self.parksnames = self.displayData.map(function(d) { return NameSelectionByCode[d.ParkName]; });

        self.colorScale = d3.scale.linear().domain(minMaxY).range(["#51A4DF","1F77B4"]);
    self.colorScale1 = d3.scale.linear().domain(minMaxY).range(["#CBD7E6","#aec7e8"]);
    self.colorScale2 = d3.scale.linear().domain(minMaxY).range(["#D79C64","#B87333"]);
    self.colorScale3 = d3.scale.linear().domain(minMaxY).range(["#FFDDBB","#ffbb78"]);
    self.colorScale4 = d3.scale.linear().domain(minMaxY).range(["#7FE17F","#2ca02c"]);
    self.colorScale5 = d3.scale.linear().domain(minMaxY).range(["#E8B2EB","#C38EC7"]);
    self.colorScale6 = d3.scale.linear().domain(minMaxY).range(["#7AD5D5","#3B9C9C"]);
    self.colorScale7 = d3.scale.linear().domain(minMaxY).range(["#FEBDBC","#ff9896"]);


        self.yScale = d3.scale.ordinal().rangeRoundBands([0, self.graphH], 0.1).domain(self.parksnames);
        self.yAxis = d3.svg.axis().scale(self.yScale).ticks(1);
        self.yAxis.orient("left");

        self.xScale
            .domain(minMaxY);
        self.xAxis
            .scale(self.xScale)
            .ticks(20)
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
            .attr("transform", "translate(0," + self.yTrans + ")")
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
            .attr('class', 'd3-tip3')
            .offset([-10, 0])
            .html(function(d,i)
            {

                var monthlyMode =" ";
                var count = " ";

                if(MonthMode != 0)
                {
                    monthlyMode = " " + MonthsByNumber[SelectedMonth] + " ";
                }

                return "<strong>Park name</strong> <span style='color:red'>" + NameSelectionByCode[d.ParkName]
                    + "</span>"+"<br>" + "<strong>" + SelectedYear + monthlyMode + FriendlyActivitiyNames[SelectedActitiy] + ":</strong> <span style='color:red'>" + self.displayData[i]["ActivityData"][IndexByActivity[SelectedActitiy]]["count"]+ "</span>";
            });

        var bars = self.visG.select(".barBox").selectAll(".bar").data(self.displayData);

        bars.exit().remove();

        bars.enter().append("rect")
            .attr({
                "class": "compareBar",
                "height": self.yScale.rangeBand(),
                "y": function (d, i) {
                    return self.yScale(self.parksnames[i])

                }
            });
        bars.call(tip);
        bars.attr({
            "width": function (d,i) {
                return self.xScale(self.displayData[i]["ActivityData"][IndexByActivity[SelectedActitiy]]["count"]);
            },
            "x": function () {
                return 0;
            }
        });



        bars.style("fill", function (d,i)
        {   if(d["ParkName"] != ActivitiesPark) {

            if (FriendlyActivitiyNames[SelectedActitiy] == "Non-Recreation Visitors")


            //return self.colorScale(self.displayData[i]["ActivityData"][IndexByActivity[SelectedActitiy]]["count"]);
                return "#1f77b4";

            if (FriendlyActivitiyNames[SelectedActitiy] == "Concession Lodging")
                return "#aec7e8";
            if (FriendlyActivitiyNames[SelectedActitiy] == "Tent Campers")

                return "#B87333";
            if (FriendlyActivitiyNames[SelectedActitiy] == "RV Campers")

                return "#ffbb78";

            if (FriendlyActivitiyNames[SelectedActitiy] == "Concession Camping")
                return "green";

            if (FriendlyActivitiyNames[SelectedActitiy] == "Backcountry Campers")
                return "#C38EC7";

            if (FriendlyActivitiyNames[SelectedActitiy] == "Misc. Campers")
                return "#3B9C9C";

            if (FriendlyActivitiyNames[SelectedActitiy] == "Total Overnight Stays")
                return "#FF9896"

        }
            else
                return "#DF7E7B"
        });

        bars.on('mouseover', tip.show);
        bars.on('mouseout', tip.hide);
        bars.on("click", function (d)
        {
            //console.log("clicked a bar for " + NameSelectionByCode[d["ParkName"]]);
            self.eventHandler(d["ParkName"]);
        });

    //Disabled

};

// Labeling
ActivitiesVis.prototype.messageVis = function()
{
    var self = this;
    //console.log("wiggin");
    var wiggin = d3.select(self.parentPane).append("g").append("text")
        .attr("class","noChartText")
        .attr("font-size","23px")
        .attr("fill","grey")
        .attr("transform","translate(" + 80 + "," + 20 + ")")
        .html("Please select an activity from the activity selector to begin")
        .attr("opacity",0);

    wiggin
        .transition()
        .duration(500)
        .attr("opacity",1);

};

ActivitiesVis.prototype.clearVis = function()
{
    var self = this;

    var doom = d3.select(self.parentPane).selectAll("g").remove();

};


ActivitiesVis.prototype.updateVis = function()
{
    var self = this;

    if(SelectedYear > 1978)
    {
        self.wasEnabled = true;
        self.enabled = true;

        var svg = d3.select(self.parentPane).selectAll("g").style("visibility","visible");
        var svg = d3.select(self.parentPane).select(".activityText").remove();
        //remove interaction block overlay
    }
    else
        self.enabled = false;

    if(self.enabled) {

        if (SelectedYear > 1978) {
            self.enabled = true;
        }
        else
            self.enabled = false;

        if (self.enabled) {
            if (SelectedActitiy != "")
                self.initVis()
            else {
                //console.log("cleared vis")
                self.clearVis();
                self.messageVis();
            }
        }
    }

    if(!self.enabled && self.wasEnabled )
    {
        var svg = d3.select(self.parentPane)
            .append("text")
            .attr("class","activityText")
            .attr("dy","1.3em")
            .attr("x",50)
            .attr("font-size","23px")
            .attr("fill","grey")
            .text("Activities view is active only for years after 1979")
            .attr("transform", "translate(70," + 40+ ")");


        var svg = d3.select(self.parentPane).selectAll("g").style("visibility","hidden");
        self.wasEnabled = false;
    }
}

/**
 * Created by Tony on 11/22/2015.
 */
