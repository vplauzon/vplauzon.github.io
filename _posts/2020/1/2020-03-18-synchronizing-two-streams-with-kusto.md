---
title:  Synchronizing two streams with Kusto
permalink: /2020/03/18/synchronizing-two-streams-with-kusto
categories:
- Solution
tags:
    - Data
    - Streaming
date:  2020-02-14
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/1/synchronizing-two-streams-with-kusto/landscape-photography-of-waterfalls-surrounded-by-green-931007.jpg" />

We discussed Azure Data Explorer (ADX) and its query language Kusto in a <span style="background-color:yellow">Past article</span>.

In this article I want to talk about a typical problem in real time analytics:  synchronizing two streams of data.

This happens all the time when sensor data are produced by different devices.  Different devices may record measurements at different times and different frequency.  In order to reason about measurements from different devices, we need to synchronize those events.

We'll first explain what the problem is.  We'll then give a naïve solution which we'll show doesn't scale.  We'll then give a solution that can scale to milion of records.

As usual, the [code is in GitHub](https://github.com/vplauzon/kusto/tree/master/sync-2-streams).

## 2 streams problem

Let's look at two streams of events from two devices:

![2 streams](/assets/posts/2020/1/synchronizing-two-streams-with-kusto/streams.png)

The events from stream 1 are letters while the events from stream 2 are numbers.

We can make a number of observations:

* No event in one stream occur at the same time than an event in the other stream
* Events aren't necessarily happening at regular pace
* Both streams don't perfectly interlace events
* Event A occur before any event in Stream 2 occur

There are multiple things we might want to do with those streams.  For this article, we'll focus on one problem:

> We want to look at measurements done in both streams, so we want measurements in stream 2 to be correlated to measurements in stream 1.

Also, we'll define the correlation further:

> The correlation should work in a way that for a measurement (event) in stream 1, we're going to take the value of the measurement in stream 2 that happend "just before" (i.e. as close as possible AND before).

We could frame the problem differently, but we found that solving this problem provides a lot of techniques that can be reused to solve similar problems.

For the example we gave we should have the following result:

|Event in Stream 1|Event in Stream 2 (correlated)
|-|-
|A|*NULL / Missing* (no event in stream 2 occured before event A)
|B|1
|C|3
|D|3
|E|5

Also, for the different solutions we are going to present, we are going to assume there are multiple assets grouping devices together.  For instance, they could represents different vehicles having multiple sensors, different elevators, different machines in a factory, etc.  .

## Naïve solution

We are going to test a solution using Kusto query language.  We suggest to try that solution on a new database.

The naïve solution is basically to formulate the problem and let Kusto take care of it.  We want, for each asset, to map an event in one stream with the latest event in the other stream that happend before or at the same time.

Let's create some sensor data.  First we measure the "colour" of an asset every *even* seconds:

```sql
.set-or-replace colours <| datatable(assetId:int, timeStamp:datetime, colour:string)
    [
    12, datetime(2020-1-1 20:00:04), "blue",
    12, datetime(2020-1-1 20:00:06), "blue",
    12, datetime(2020-1-1 20:00:08), "red",
    13, datetime(2020-1-1 20:00:04), "yellow",
    13, datetime(2020-1-1 20:00:06), "yellow",
    13, datetime(2020-1-1 20:00:08), "green",
    ];
```

So we had two assets (12 & 13) having "colour" measurements taken every two seconds.

Then we measure the temperature of an asset every *odd* seconds:
```sql
.set-or-replace temperatures <| datatable(assetId:int, timeStamp:datetime, temperature:int)
    [
    12, datetime(2020-1-1 20:00:05), 20,
    12, datetime(2020-1-1 20:00:07), 22,
    12, datetime(2020-1-1 20:00:09), 25,
    13, datetime(2020-1-1 20:00:05), 15,
    13, datetime(2020-1-1 20:00:07), 13,
    13, datetime(2020-1-1 20:00:09), 10,
    ];
```

If we join the two measures by asset-id, we get the usual cross-product, i.e. this returns 18 records:
```sql
colours
| join kind=inner temperatures on assetId
```

We want to find the timestamp in temperatures that is the closest to the one in colours ; we want one early or at the same time.  This is how we're going to eliminate the cross-product rows. Let's start by having the colour timestamp be greater or equal to emperature's timestamp:
```sql
colours
| join kind=inner temperatures on assetId
| where timeStamp >= timeStamp1
```

Instead of 18 records, that returns 6.  Notice we lost the colour measure at 20:00:04 since there is no earlier measure in temperature.

Now, let's take the largest temperature's timestamp for each colour's timestamp.  This gives us a mapping, by asset, of the 2 sensors timestamp
```sql
colours
| join kind=inner temperatures on assetId
| where timeStamp >= timeStamp1
| summarize temperatureTimeStamp=max(timeStamp1) by assetId, colourTimeStamp=timeStamp
```

Now, let's use that mapping to match the sensor values.  Again we lost the two colour readings at 20:00:04 since there was no temperature reading earlier or at the same time.
```sql
let mapping=colours
| join kind=inner temperatures on assetId
| where timeStamp >= timeStamp1
| summarize temperatureTimeStamp=max(timeStamp1) by assetId, colourTimeStamp=timeStamp;
colours
| join kind=inner mapping on assetId
| where timeStamp == colourTimeStamp
| join kind=inner temperatures on assetId
| where timeStamp1 == temperatureTimeStamp
| project assetId, colourTimeStamp, temperatureTimeStamp, colour, temperature
```

This gives us the mapping we are looking for:

assetId|colourTimeStamp|temperatureTimeStamp|colour|temperature
-|-|-|-|-
12|	2020-01-01T20:00:06Z|	2020-01-01T20:00:05Z|	blue|	20
13|	2020-01-01T20:00:06Z|	2020-01-01T20:00:05Z|	yellow|	15
12|	2020-01-01T20:00:08Z|	2020-01-01T20:00:07Z|	red|	22
13|	2020-01-01T20:00:08Z|	2020-01-01T20:00:07Z|	green|	13

## Scaling the naïve solution

The solution works.  Let's see if it can scale.

Let's create 10 millions records colour table (with 5000 assets):
```sql
.set-or-replace fullColours <|
(
    range i from 0 to 10000000 step 1
    | extend assetId = 1 + i % 5000
    | extend timeStep = i / 5000
    | extend timeStamp = datetime(2010-1-1 0:00:00) + timeStep * 2s
    | extend r = rand(3)
    | extend colour = case(r==0, "green", r==1, "yellow", "red")
    | project assetId, timeStamp, colour
)
```

Similarly, let's create 20 millions records (5000 assets) temperature table.  This will cover the same time range but with twice the measurement frequency.
```sql
.set-or-replace fullTemperatures <|
(
    range i from 0 to 20000000 step 1
    | extend assetId = 1 + i % 5000
    | extend timeStep = i / 5000
    | extend timeStamp = datetime(2010-1-1 0:00:00) + timeStep * 1s
    | extend temperature = 10 + rand(25)
    | project assetId, timeStamp, temperature
)
```

Now, let's try the same solution on the bigger tables
```sql
let mapping=fullColours
| join kind=inner fullTemperatures on assetId
| where timeStamp <= timeStamp1
| summarize temperatureTimeStamp=min(timeStamp1) by assetId, colourTimeStamp=timeStamp;
mapping
| limit 10
```

This fails on a dev cluster (E_RUNAWAY_QUERY):




## Time in a bucket

## Solution with bucketted time

//  Let's try the approach laid out in
//  https://docs.microsoft.com/en-us/azure/kusto/query/join-timewindow
//  We quantitize time in bins.
//  The size of the bucket should be the longest time interval we expect
//  between the 2 sensors' reading.  This should be including clock
//  discrepencies.
//  Here we choose 1 seconds
```sql
let maxDelta=1s;
colours
| project-rename colourTimeStamp=timeStamp
//  Create an array of 2 values for the time key
| extend colourTimeKey=pack_array(
    bin(colourTimeStamp-maxDelta, maxDelta),
    bin(colourTimeStamp, maxDelta))
//  Expand that array into 2 rows
| mv-expand colourTimeKey to typeof(datetime)
| join kind=inner
(
    temperatures
    | project-rename temperatureTimeStamp=timeStamp
    | extend temperatureTimeKey=bin(temperatureTimeStamp, maxDelta)
)
on $left.assetId==$right.assetId, $left.colourTimeKey==$right.temperatureTimeKey
| where colourTimeStamp > temperatureTimeStamp
| summarize temperatureTimeStamp=max(temperatureTimeStamp) by assetId, colourTimeStamp;
```

//  We obtain the same result as before
//  The result set is so small, it's not possible to measure how more
//  memory-efficient it was though
//  So let's try on the bigger result set
```sql
.set-or-replace fullColoursWithTemperatures <|
let maxDelta=1s;
let mapping=fullColours
| project-rename colourTimeStamp=timeStamp
//  Create an array of 2 values for the time key
| extend colourTimeKey=pack_array(
    bin(colourTimeStamp-maxDelta, maxDelta),
    bin(colourTimeStamp, maxDelta))
//  Expand that array into 2 rows
| mv-expand colourTimeKey to typeof(datetime)
| join kind=inner
(
    fullTemperatures
    | project-rename temperatureTimeStamp=timeStamp
    | extend temperatureTimeKey=bin(temperatureTimeStamp, maxDelta)
)
on $left.assetId==$right.assetId, $left.colourTimeKey==$right.temperatureTimeKey
| where colourTimeStamp > temperatureTimeStamp
| summarize temperatureTimeStamp=max(temperatureTimeStamp) by assetId, colourTimeStamp;
fullColours
| join kind=inner mapping on assetId
| where timeStamp == colourTimeStamp
| join kind=inner fullTemperatures on assetId
| where timeStamp1 == temperatureTimeStamp
| project assetId, colourTimeStamp, temperatureTimeStamp, colour, temperature
```

//  We can notice the cardinality of that last table is 9 995 001
//  That is 5000 less than the fullColours table
//  This makes sense as the first record for each of the 5000 assets
//  doesn't have a measurement in the fullTemperature table
```sql
fullColoursWithTemperatures
| count
```

## Summary
