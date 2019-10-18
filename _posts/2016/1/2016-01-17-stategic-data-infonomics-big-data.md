---
title:  Stategic Data, Infonomics & Big Data
date:  01/18/2016 00:00:09
permalink:  "/2016/01/17/stategic-data-infonomics-big-data/"
categories:
- Solution
- Strategy
tags:
- Big Data
- Data
---
<b><i>UPDATE (19-01-2016):  Have a look at <a href="http://vincentlauzon.com/about/azure-data-lake/">Azure Data Lake series </a>for more posts on Azure Data Lake.</i></b>

<a href="assets/2016/1/stategic-data-infonomics-big-data/big-data-analytics1.jpg"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="From http://www.realwire.com/" src="assets/2016/1/stategic-data-infonomics-big-data/big-data-analytics1_thumb.jpg" alt="From http://www.realwire.com/" width="240" height="166" align="left" border="0" /></a>I wanted to talk a bit about your Strategic Data &amp; the concept of <a href="https://en.wikipedia.org/wiki/Data_lake" target="_blank">Data Lake</a> (regardless of its implementation).

Nowaday, data is seen less and less as a commodity, as a byproduct of running systems.  More &amp; more it is seen as an asset.  For some tech giant, data is their lifeblood, their treasure chest.

This is the essence of <a href="https://en.wikipedia.org/wiki/Infonomics" target="_blank">Infonomics</a>:  assigning economic value to information.  The 7 principles of Infonomics are:
<ol>
	<li>Information is an asset</li>
	<li>Information has both potential and realized value</li>
	<li>Information’s value can be quantified</li>
	<li>Information should be accounted for as an asset</li>
	<li>Information’s realized value should be maximized</li>
	<li>Information’s value should be used for prioritizing and budgeting IT and business initiatives</li>
	<li>Information should be managed as an asset</li>
</ol>
Now Infonomics is an emerging discipline and appears is stark contrast with today’s reality of most Enterprises.
<h2>Today’s data strategy</h2>
Today, Enterprise data is centered around systems managing them (e.g. ERP, CRM, payroll, corporate CMS, etc.) and is therefore silo-ed within those systems.  The data is captured, stored &amp; analyzed within those systems.

<a href="assets/2016/1/stategic-data-infonomics-big-data/image11.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/1/stategic-data-infonomics-big-data/image_thumb11.png" alt="image" width="1008" height="710" border="0" /></a>

This model leverages the strength of each Enterprise system in managing the data it produces, with the intimate knowledge of that data.  Of course the major weakness of that model is that data exist in silos which produces various problems ranging from irritants to strategic problems.  To name just a few:
<ul>
	<li>Double entry ; the necessity for a user to capture data in two systems manually, e.g. a customer information in the CRM &amp; the ERP</li>
	<li>Duplication / poor management of data ; Enterprise Systems tend to manage their core data well and their satellite data poorly.  For instance, that customer information you entered in the ERP might be duplicated for each order and some data might be concatenated into a 'free form' text field.</li>
	<li>Difficulty to reconcile data between systems ; each system is likely going to use their own identification mechanism and it might be hard to reconcile two customer profile in two different CRMs, e.g. as a bank account &amp; an insurance account.</li>
</ul>
Different strategies can be put in place to mitigate those issues.

A common one is to integrate different systems together, i.e. passing data from one system to another via some interfaces, either real-time, near real-time or in offline batches.  This approach helps each system have their own view of the world and keep the illusion that they are the center of your world.

<a href="assets/2016/1/stategic-data-infonomics-big-data/image12.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/1/stategic-data-infonomics-big-data/image_thumb12.png" alt="image" width="640" height="451" border="0" /></a>

Another strategy is to integrate data outside those systems, either in a Data warehouse or in a Master Data Management (MDM) system.  This approach recognizes that no system has a complete view of your strategic data and creates this view outside those systems.  It has the main advantage of freeing you from some of the constraints of each system to get a general view of the data.

<a href="assets/2016/1/stategic-data-infonomics-big-data/image13.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/1/stategic-data-infonomics-big-data/image_thumb13.png" alt="image" width="524" height="480" border="0" /></a>

Now what those data integration avenue have in common is:
<ul>
	<li>Most of the data life cycle (e.g. historisation, retention) is still managed by your Enterprise systems</li>
	<li>They are very expensive and rigid in nature, often spawning monthly projects to put in place</li>
</ul>
Now this was all nice and fine until a couple of years ago when internet broke loose and with the constant cost drop of storage created this new world of Big Data.
<h2>Big Data</h2>
<a href="http://www.gartner.com/it-glossary/big-data/" target="_blank">Gartner defines Big Data</a> as

<em>Big data is high-volume, high-velocity and/or high-variety information assets that demand cost-effective, innovative forms of information processing that enable enhanced insight, decision-making, and process automation.</em>

Today, your systems are probably spewing data.  As you engage your customers more and more on the web and in the mobile world, you get a was amount of telemetry &amp; other valuable data.  You want to reference partner data related to your data, for instance, research data on your customer’s demographics.  More &amp; more you find perceived value in information you were discarding quickly yesterday (e.g. logs).

This is where the concept of <a href="https://en.wikipedia.org/wiki/Data_lake" target="_blank">Data Lake</a> becomes interesting.
<h2>Data Lake</h2>
A Data Lake isn’t a big data Data Warehouse.  It’s a <em>large storage repository of raw data</em>.  The term comes from the comparison of bottle water (structured, cleansed &amp; managed data) with…  a lake (your raw, unprocessed &amp; un-cleansed data).

Because it is raw data, it doesn’t have all the project cost related to data warehousing or MDM projects.  It also doesn’t have the benefits.

The idea is that you migrate all your strategic data into a Data Lake, that is you copy it over.  Once there you can later run analytics on it, in discovery mode (small teams, data science) first and later once you found value, in a more structure approach.

<a href="assets/2016/1/stategic-data-infonomics-big-data/image14.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/1/stategic-data-infonomics-big-data/image_thumb14.png" alt="image" width="443" height="480" border="0" /></a>

The majors advantages of a Data Lake are:
<ul>
	<li>You store ALL your data, it is your treasure chest</li>
	<li>The economic model is that you invest in processing the data when you choose to dig in and analyse it as oppose to upfront ; this buys you agility, the ability to trial different data science avenue, fail fast on analytics and mine all your data</li>
</ul>
The idea of keeping ALL your data at one spot to mine it later might seems like a cosmetic change to your Enterprise Architecture, but it is in fact a HUGE enabler!

A good examples are logs.  In traditional approaches logs would be mined for some information by querying system logs and extracting some information on it (e.g. aggregate visits) and storing the results in a data warehouse.  Comes a change in your business and you need to go back to the original logs to extract more information?  Well the logs from 3 months ago are gone and the one you have would require to re-open the data movement orchestration that took months to develop by a team of consultants who have since left the building.  Are you sure you need those?  Can you justify it?

With a Data Lake, you kept ALL your raw data, all your logs.  You can go back and mine information you didn’t use at first to see if the value you suspect is there actually is.

You can gradually refine your data, e.g. using <a href="http://vincentlauzon.com/2015/12/28/checkpoints-in-etl/">checkpoints</a>, the same way ore is refined in an industrial process.  But you can always go back to an unrefined stage and bring more material to the next level.

In many ways, those aren’t new concepts.  Typical Data warehouse systems will have staging environments where you’ll keep intermediary representation of your data.  The key difference is that typically you would flush lots of data in the name of server constraints.  In a Data Lake mindset you would typically have a Big Data approach where those constraints do not exist.
<h2>Data Lake in Azure</h2>
In Azure, you could use the new <a href="https://azure.microsoft.com/en-us/services/data-lake-store/" target="_blank">Data Lake Store</a> to store both unstructured data (i.e. files) and structured data (i.e. tables).  This allows you to store your raw data and then gradually refine it in more structured way without worrying about the size of your data all along.  You could use standard blob storage if the size of your data is below 500 TB.  You could use the new <a href="http://vincentlauzon.com/2015/09/30/azure-data-lake-early-look/">Data Lake Analytics</a> to process that data at scale, <a href="https://azure.microsoft.com/en-us/services/data-factory/" target="_blank">Azure Data Factory</a> to orchestrate that processing and the movement of your data to more operational stores, such as <a href="https://azure.microsoft.com/en-us/services/sql-data-warehouse/" target="_blank">Azure Datawarehouse</a> or <a href="https://azure.microsoft.com/en-us/services/sql-database/" target="_blank">Azure SQL Database</a>.
<h2>Conclusion</h2>
But whatever the actual technical solution you use, the concept of a Data Lake where you keep ALL your data for further processing, can help you realize infonomics on your Strategic data within your Enterprise.