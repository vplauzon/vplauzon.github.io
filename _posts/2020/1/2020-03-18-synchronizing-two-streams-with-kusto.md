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

We'll first explain what the problem is.  We'll then give a naïve solution which we'll show doesn't scale.  We'll then give a solution that can scale to millions of records.

As usual, the [code is in GitHub](https://github.com/vplauzon/kusto/tree/master/sync-2-streams).

## 2 streams problem

Let's look at two streams of events from two devices:

![2 streams](/assets/posts/2020/1/synchronizing-two-streams-with-kusto/streams.png)

The events from stream 1 are letters while the events from stream 2 are numbers.

We can make several observations:

* No event in one stream occur at the same time than an event in the other stream
* Events aren't necessarily happening at regular pace
* Both streams don't perfectly interlace events
* Event A occur before any event in Stream 2 occur

There are multiple things we might want to do with those streams.  For this article, we'll focus on one problem:

> We want to look at measurements done in both streams, so we want measurements in stream 2 to be correlated to measurements in stream 1.

Also, we'll define the correlation further:

> The correlation should work in a way that for a measurement (event) in stream 1, we're going to take the value of the measurement in stream 2 that happened "just before" (i.e. as close as possible AND before).

We could frame the problem differently, but we found that solving this problem provides a lot of techniques that can be reused to solve similar problems.

For the example we gave we should have the following result:

|Event in Stream 1|Event in Stream 2 (correlated)
|-|-
|A|*NULL / Missing* (no event in stream 2 occurred before event A)
|B|1
|C|3
|D|3
|E|5

Also, for the different solutions we are going to present, we are going to assume there are multiple assets grouping devices together.  For instance, they could represents different vehicles having multiple sensors, different elevators, different machines in a factory, etc.  .

## Naïve solution

We are going to test a solution using Kusto query language.  We suggest trying that solution on a new database.

The naïve solution is basically to formulate the problem and let Kusto take care of it.  We want, for each asset, to map an event in one stream with the latest event in the other stream that happened before or at the same time.

Let's create some sensor data.  First, we measure the "colour" of an asset every *even* second:

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

We had two assets (12 & 13) having "colour" measurements taken every two seconds.

Then we measure the temperature of an asset every *odd* second:
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

We want to find the timestamp in temperatures that is the closest to the one in colours ; we want one early or at the same time.  This is how we're going to eliminate the cross-product rows. Let's start by having the colour timestamp be greater or equal to temperature's timestamp:
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

Now, let's use that mapping to match the sensor values.  We lost the two colour readings at 20:00:04 again since there was no temperature reading earlier or at the same time.
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

Let's create 10 million records colour table (with 5000 assets):
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

Similarly, let's create 20 million records (5000 assets) temperature table.  This will cover the same time range but with twice the measurement frequency.
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

This query fails on a dev cluster:

![Failure](/assets/posts/2020/1/synchronizing-two-streams-with-kusto/failure.png)

The reason this fails is that the query doesn't scale.  It requires to do an aggregation for each of the 10 million records over million of other records.

## Time in a bucket

We'll develop a more scalable solution in this section.  This is largely inspired by the [join-timewindow](https://docs.microsoft.com/en-us/azure/kusto/query/join-timewindow) article on the online documentation but it gives a more general solution.

What we want to do is to reduce drastically the cardinality of the set on which we perform an aggregation, i.e. the `min(timeStamp1)` in the last section.  The issue we have is that we join on *assetID* but we take all the *temperature* measurements for that asset.  What we would like to do is just take measurements *around* the timestamp of the colour measurement.

We can't join on a range of value.  The trick is to quantize the time variable into buckets.  Doing this we can then join on a given time bucket.

![Failure](/assets/posts/2020/1/synchronizing-two-streams-with-kusto/buckets.png)

If we look at the example above, we can immediately see that we can't simply go within one bucket.  This works for event A, B, C & E but not for D.  Although D is in bucket *Delta*, the correlated event of stream 2, i.e. event 3, is in bucket *Gamma*.

How far back do we need to go?

In order not to force ourselves to go back to the beginning in the general case, we need to impose a constraint on the problem.  We need to cap the distance between an event in stream 1 and its correlated event in stream 2.  We'll call that "distance" *maxDelta*, i.e. the maximum delta between two events in two different streams.

Given that, we can have an elegant solution:

*   Let's define the time bucket being of size *maxDelta* (a time span)
* This way we only need the bucket of the event in stream 1 and the preceeding bucket.

This is easy to see.  The extreme cases are as follow:

* The correlated event is happening at the same timestamp as the event in stream 1:  in this case we only need the time bucket of stream 1's event
* The correlated event is happening *maxDelta* **before** the event in stream 1:  in this case, the event will be in the previous bucket

We can easily see that cases in between fall in between.

This allows us to drastically reduce the cardinality of the set as we wanted, provided *maxDelta* is small enough.

## Solution with bucketed time

Here we choose 1 second for *maxDelta*.  We'll first try on the small tables:
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

We obtain the same result as before.

The result set is so small, it's not possible to measure how more memory-efficient it was though.

Let's try on the bigger result set and let's store the result in a new table:
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

This query runs in about 50 seconds on a cluster of sku *dev* (i.e. the smallest / cheapest cluster).

It is still demanding, but it does execute and terminate.

We can notice the cardinality of that last table is 9 995 001.

That is 5000 less than the *fullColours* table.

```sql
fullColoursWithTemperatures
| count
```

This makes sense as the first record for each of the 5000 assets doesn't have a measurement in the fullTemperature table.

## Missing first records

As pointed out in the last section, this solution will remove the first record of each asset if there is no event in stream 2 happening before the first event in stream 1.

In order to fix that, we could simply detect those and union another query fetching the record "just after".

## Taking previous event

We assumed that taking the previous event was a good idea.

A more general solution would be to interpolate (e.g. linearly) the measurement values.  This would be useful especially if measurements in one of the streams are far in between and are not "slow moving".

## Relative time

The exercise we did was to correlate events in stream 1 with events in stream 2.  It is important to notice that process isn't symetric.

For instance, just looking at our earlier diagram we would see that event 'B' correlates with event '1', but taken the other way around, event '1' would correlate with event 'A', not event 'B'.

For this reason, it is important not to mix the two.

## Summary

We showed how to synchronize two measurement streams.  There is more than meets the eye for this apparently simple operation.  It also is quite demanding in terms of computing.

The time bucket technique can be reused in a multitude of context.