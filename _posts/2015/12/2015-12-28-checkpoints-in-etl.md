---
title:  Checkpoints in ETL
date:  2015-12-28 19:00:31 -05:00
permalink:  "/2015/12/28/checkpoints-in-etl/"
categories:
- Solution
tags:
- Big Data
- Data
---
<em><strong><b><i>UPDATE (19-01-2016):  Have a look at </i></b><a href="http://vincentlauzon.com/about/azure-data-lake/"><b><i>Azure Data Lake series </i></b></a><b><i>for more posts on Azure Data Lake.</i></b></strong></em>

Extract, Transform &amp; Load (ETL) are so 2000's.  But then again, they are more popular than ever!

On one hand, ETL are from an era where you didn't care too much about real-time insights or couldn't afford it because of technical limitation.  Today, we prefer integrating data in near real-time, with technologies such as APIs, web hooks, messaging &amp; many others.

On the other hand, with the advent of bid data and other modern challenges (e.g. global markets), we often can't integrate all the data in real time.  Also, let's face it, it often isn't worth the problems and ETL do not have to be run only once a day either, enabling shades of grey.

Since ETL are here to stay, it's a good idea to be familiar with their proven patterns.  One pattern I want to introduce here today is the checkpoint pattern.
<h2>Why Checkpoints?</h2>
Mathematically, you could model an ETL as y = f(x), where x is your input, the result of your extract, f is the transform and y is the result of the transform on the input (the load part of ETL).

In practice though, the transformation happens in multiple steps and many things could go wrong.  Since we are only human, it makes sense to give us a chance to:
<ul>
	<li>Trace the transformation steps</li>
	<li>Allow us the possibility to re-run parts of a transformation</li>
	<li>Allow us to roll back parts of a transformation</li>
</ul>
Checkpoints help us achieve that.  Checkpoints are basically points in your transformation where you persist the current state of the data <em>within the transformation</em>.
<h2>Example</h2>
Here I’m gona give an example.  Take it with a pinch of salt.  Like every examples, it oversimplies part of the problem and overengineer other parts.

In my example, we’re going to take tweets (how can we do an data example without those?) from certain users and perform some analysis on it before feeding the result to a Machine Learning engine.

The input comes in CSV files:

[code language="text"]

accountname, tweet
@john, “Leaving for work now”
@julie, “12km in one hour this morning!”
@zul, “The trees, the leaves &amp; the wind, no more”

[/code]

The first thing we’re gona do is to load it <em>as is</em> in a database table:
<table border="3" width="846">
<thead>
<tr style="background:green;color:white;">
<th>LoadID</th>
<th>Line</th>
<th>Account</th>
<th>Tweet</th>
</tr>
</thead>
<tbody>
<tr>
<td>123</td>
<td>1</td>
<td>@john</td>
<td>Leaving for work now</td>
</tr>
<tr>
<td>123</td>
<td>2</td>
<td>@julie</td>
<td>12km in one hour this morning!</td>
</tr>
<tr>
<td>123</td>
<td>3</td>
<td>@zul</td>
<td>The trees, the leaves &amp; the wind, no more</td>
</tr>
</tbody>
</table>
With a load table with the following enty:
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th>LoadID</th>
<th>FileName</th>
<th>LoadStart</th>
<th>LoadCompletion</th>
</tr>
</thead>
<tbody>
<tr>
<td>123</td>
<td>wasb://tweets@raw/2016/1/1/asduy123478d.csv</td>
<td>XYZ</td>
<td>XYZ-2</td>
</tr>
</tbody>
</table>
That’s our first checkpoint.  We didn’t transform anything yet beside the format.  So we do a few things here:
<ul>
	<li>We put the CSV in a table
<ul>
	<li>It’s a tiny transformation by itself and some parsing errors could occur and be traced</li>
	<li>It gives an access to the raw data in a table format</li>
</ul>
</li>
	<li>We have traceability of what took place with the load table
<ul>
	<li>We aggregate all the entries of a same file with a load-ID</li>
	<li>We track when the load happened &amp; how much time it took</li>
</ul>
</li>
</ul>
Next we’re going to structure the data. First is the account able:
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th>AccountID</th>
<th>Account</th>
<th>CreatedFromLoadID</th>
</tr>
</thead>
<tbody>
<tr>
<td>54</td>
<td>john</td>
<td>123</td>
</tr>
<tr>
<td>55</td>
<td>julie</td>
<td>123</td>
</tr>
<tr>
<td>56</td>
<td>zul</td>
<td>123</td>
</tr>
</tbody>
</table>
Then the tweet table:
<table border="3" width="846">
<thead>
<tr style="background:green;color:white;">
<th>TweetID</th>
<th>CreatedFromLoadID</th>
<th>CreatedFromLine</th>
</tr>
</thead>
<tbody>
<tr>
<td>54</td>
<td>123</td>
<td>1</td>
</tr>
<tr>
<td>55</td>
<td>123</td>
<td>2</td>
</tr>
<tr>
<td>56</td>
<td>123</td>
<td>3</td>
</tr>
</tbody>
</table>
Then the tweetContent table:
<table border="3" width="846">
<thead>
<tr style="background:green;color:white;">
<th>TweetContentID</th>
<th>TweetID</th>
<th>Word</th>
</tr>
</thead>
<tbody>
<tr>
<td>346</td>
<td>54</td>
<td>Leaving</td>
</tr>
<tr>
<td>347</td>
<td>54</td>
<td>for</td>
</tr>
<tr>
<td>348</td>
<td>54</td>
<td>work</td>
</tr>
<tr>
<td>349</td>
<td>54</td>
<td>now</td>
</tr>
<tr>
<td>350</td>
<td>55</td>
<td>12km</td>
</tr>
<tr>
<td>351</td>
<td>55</td>
<td>in</td>
</tr>
<tr>
<td>352</td>
<td>55</td>
<td>one</td>
</tr>
<tr>
<td>353</td>
<td>55</td>
<td>hour</td>
</tr>
<tr>
<td>354</td>
<td>55</td>
<td>this</td>
</tr>
<tr>
<td>355</td>
<td>55</td>
<td>morning!</td>
</tr>
<tr>
<td>356</td>
<td>56</td>
<td>The</td>
</tr>
<tr>
<td>357</td>
<td>56</td>
<td>trees</td>
</tr>
<tr>
<td>358</td>
<td>56</td>
<td>,</td>
</tr>
<tr>
<td>359</td>
<td>56</td>
<td>the</td>
</tr>
<tr>
<td>360</td>
<td>56</td>
<td>leaves</td>
</tr>
<tr>
<td>361</td>
<td>56</td>
<td>&amp;</td>
</tr>
<tr>
<td>362</td>
<td>56</td>
<td>the</td>
</tr>
<tr>
<td>363</td>
<td>56</td>
<td>wind</td>
</tr>
<tr>
<td>364</td>
<td>56</td>
<td>,</td>
</tr>
<tr>
<td>365</td>
<td>56</td>
<td>no</td>
</tr>
<tr>
<td>366</td>
<td>56</td>
<td>more</td>
</tr>
</tbody>
</table>
So, again, at this second checkpoint, we persist everything and we trace it back to the original load.  We could therefore re-run the second transformation, for instance, if we choose to remove the punctuation from the word itemization.

We could have a third checkpoint where we count the words but I suppose you get the point by now.
<h2>Pattern</h2>
So what are the characteristics of the checkpoint pattern?
<ul>
	<li>For each step of a transformation you persist your state</li>
	<li>Each step traces back to the previous step</li>
	<li>You can therefore rollback or re-run a step</li>
	<li>You can therefore inspect what happend and potentially understand why the final results contain unexpected values</li>
</ul>
This ties in nicely with the concept of Data Lake.  A Data Lake contains the raw data (in my example the CSV files) but also the refined data.

In ETL you would often call those checkpoints <em>staging tables </em>and would likely dispose of them early.  In a data lake you might keep them around longer.

Also, here we saw one transformation path, but there could be an arborescence.  You could have one transformation distilling the content of tweets and another transformation loading geographic data and cross-referencing it with the tweets.

This is why you want to load all your data first and dropping data only at later stages.  This way you could always start a new transformation using the original data.  That’s the value of a data lake:  you always keep the maximum information even if it is hard to use in its original format.
<h2>Conclusion</h2>
This was one pattern for ETL.  There are many others but I have observed that experts in ETL (by no mean am I one) are always using it for operational reasons.

The example I gave was fairly trivial and you might not want to checkpoint on so many micro-steps, but I tried to illustrate the pattern and the value it brings.  It for you to find where the sweet spot for your solution is.

In Azure you would use Azure Data Factory to drive the transformations and you might want to store both your files and structured data in Azure Data Lake Storage (ADLS).  By keeping your data around you could always change your transformation algorithm and recreate the target data at scale.