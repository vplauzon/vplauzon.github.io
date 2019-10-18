---
title:  Cosmos DB Performance with Geospatial Data
date:  2017-10-25 22:13:46 +00:00
permalink:  "/2017/10/25/cosmos-db-performance-with-geospatial-data/"
categories:
- Solution
tags:
- Data
- NoSQL
---
<a href="assets/2017/10/cosmos-db-performance-with-geospatial-data/pexels-photo-3484891.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-348489[1]" src="assets/2017/10/cosmos-db-performance-with-geospatial-data/pexels-photo-3484891_thumb.jpg" alt="pexels-photo-348489[1]" width="320" height="483" align="right" border="0" /></a>Time for some performance tests on Cosmos DB around Geospatial coordinates!

Let’s hurt the service and see where it shines, where it has a hard time and how scaling it (i.e. increasing Request Units or RUs) helps.

We’ll publish an how-to create the same setup in a future article so tests can be reproduced.  In the meantime, the <a href="https://github.com/vplauzon/cosmos-db/tree/master/Cosmos-DB-Geo-Perf/PerfTest" target="_blank" rel="noopener">C# code for the performance test is on GitHub</a>.
<h2>Setup</h2>
We are testing <a href="https://docs.microsoft.com/en-us/azure/cosmos-db/geospatial" target="_blank" rel="noopener">Cosmos DB geospatial capabilities</a>.  Those rely on <a href="https://tools.ietf.org/html/rfc7946" target="_blank" rel="noopener">GeoJSON specification</a>.

We populated a partitioned collection with random data.

We wanted some volume so we did put of lot of non-geospatial data in there.  Documents have a geospatial “point” but also a bunch of long random strings and numbers.  Here is a sample document:

[code language="JavaScript"]

{
 &quot;part&quot;: &quot;2802&quot;,
 &quot;name&quot;: &quot;s2%R/@qcP@T&lt;W?n_]\&quot;f#2]QF3QHHC]PvzCDWP;`aE]WDCC`&gt;Fnw?w9x9/+a(j^%^&quot;,
 &quot;profile&quot;: {
 &quot;age&quot;: 89,
 &quot;salary&quot;: 23967.67,
 &quot;project&quot;: &quot;A$zGuVg/a8\\r[EComB\&quot;zF!'82lR]M((1Z?Omt?Gm%,OE&amp;QlO%w4Ti;NO+w5F?umRJdxwOk-b^bMkL/s)3qV_+Ph!VEvm//cO\\!,Itebb\\gn_&gt;dK4tbyG.Rgh/tPW@DwG&quot;
 },
 &quot;alias&quot;: {
 &quot;name&quot;: &quot;m#L]wu6.vw/Sj6LwI1=Ph&amp;!cM!782m!knm&amp;u5b![@1',g-uo'_7k+mZgMbg&lt;!22\&quot;X'*1Nf8&amp;8?Szu#WbeWB5[VwWonJC-S,./9SUudjypf&lt;Xf2e\\&gt;06jDFwwXi]@@\\+2/X&gt;9d/1KE]F*Z!,7[1\&quot;]`g&amp;]#_&lt;O\\%fC\\Z`Oc55e_dP#q]\\bzW%:^0=[d3U*x%k-r,H0s_&lt;P=n_5_ks`#$3;D:L]Ko`8/6y#'BTcxU@-*1LP'_j#)BxC!A5V9yu9^M@.&quot;,
 &quot;reference&quot;: &quot;m@,%ms)`75so_7lLsM&lt;y++b&amp;BTdw('DPZ3C/j?RuHfzMF!lT$#2XH`zn&amp;HEy_Z\&quot;[;*b9?K_!jWG$.G^X3-&amp;\\6ts)R'&lt;Yu.-xWg51#.e+Rz#*1jdQxPk:gj%yw/c.X`f6F0ya#l^v!Bm/4#&lt;Ljmp8\\=o@q$1=yck$RE(&amp;)onVr*Op.Fev(j664oZD&amp;\\n+(9wFd`&amp;uGEYoI&amp;Bg_CXl5i27UWsQ@]\\KL9zAo1FF-#OhB\\`Dk_-6PTA8Hp0*\\7b^fCFO&quot;
 },
 &quot;weapon&quot;: &quot;eew,/:0GQxEOp0O8&amp;m4=v$ousJB=..giIy!(SdW2.0qr@y(+!.&amp;t0&amp;]l#'C;QJW9=,ebaN#!aQ!q2DbW6'Vb!)U-\\gkfouy/&amp;plw1l=yTq0c`m]uS9HWCJu&lt;sN_R%]C)b.PIYEPb?HDn&gt;4@&lt;`SUSa/$$dt7-atQyS%LMgs0HJ#XX0XAXp0,dd0n=Bf\&quot;-bpgFG9;v*^rscbxDnCnBY2Gd?P]-m@F(p\\BY;3ai;&lt;3b_zLc_v(p0@Fk9pFwB-u?+lFEqj=2k@93K+48)4I9jl\\W[`k-VwL`J\\hT*WI]`^\\U=BOI%lKq[VXD^Qc7=+ZhEylN&quot;,
 &quot;location&quot;: {
 &quot;type&quot;: &quot;Point&quot;,
 &quot;coordinates&quot;: [
 -73.69452978624741,
 45.521848354422204
 ]
 },
 &quot;id&quot;: &quot;f06047a6-d5e7-4b10-dc30-7797f7a0145d&quot;,
 &quot;_rid&quot;: &quot;VlN5AL+aJAAIAAAAAAAAAA==&quot;,
 &quot;_self&quot;: &quot;dbs/VlN5AA==/colls/VlN5AL+aJAA=/docs/VlN5AL+aJAAIAAAAAAAAAA==/&quot;,
 &quot;_etag&quot;: &quot;\&quot;0100a6dc-0000-0000-0000-59ea53720000\&quot;&quot;,
 &quot;_attachments&quot;: &quot;attachments/&quot;,
 &quot;_ts&quot;: 1508529010
}
[/code]

The idea here was not to create a too artificial sample set containing only indexed geospatial data in a very compact form.  Instead we have lots of noise.  Actually, only %33 of documents contain geospatial data (the other %66 skip the location node).

The geospatial location was taken on a rectangle containing the island of Montreal.

Here are the main attributes of the sample set:
<ul>
 	<li>There are 1 200 000 documents</li>
 	<li>Documents are distributed on 4000 logical partitions with 300 documents per logical partition</li>
 	<li>%33 of documents (i.e. 400 000 documents) have a location node with a geospatial “point” in there</li>
 	<li>Points are scattered uniformly on the geospatial rectangle</li>
 	<li>There are no correlation between the partition key and the geospatial point coordinates</li>
</ul>
We ran the tests with 4 different Request Units (RUs) configurations:
<ul>
 	<li>2500</li>
 	<li>10000</li>
 	<li>20000</li>
 	<li>100000</li>
</ul>
<h2>First test:  within a polygon</h2>
For the first test we take a query looking for points within a given polygon:

[code language="SQL"]

SELECT VALUE COUNT(1)
FROM record r
WHERE ST_WITHIN(
r.location,
{'type':'Polygon', 'coordinates':[@polyCoordinates]})

[/code]

The polygon coordinates are passed in parameter here.

The query simply counts the number of point.  We found that other aggregates (e.g. computing the average of a coordinate) yield similar performance.

The polygon is built according to two parameters:  radius &amp; edge count.  We basically “approximate” a circle of a given radius with a polygon of a given number of edges.

Here is the complete data:
<table>
<thead>
<tr style="background:green;">
<th>RU</th>
<th>Radius</th>
<th>Edge Count</th>
<th># points</th>
<th>Elapsed</th>
</tr>
</thead>
<tbody>
<tr>
<td>2500</td>
<td>0.005</td>
<td>50</td>
<td>190.8</td>
<td>0:00:00.105</td>
</tr>
<tr>
<td>2500</td>
<td>0.005</td>
<td>25</td>
<td>189.6</td>
<td>0:00:00.110</td>
</tr>
<tr>
<td>2500</td>
<td>0.005</td>
<td>10</td>
<td>180</td>
<td>0:00:00.126</td>
</tr>
<tr>
<td>2500</td>
<td>0.005</td>
<td>4</td>
<td>126.4</td>
<td>0:00:00.365</td>
</tr>
<tr>
<td>2500</td>
<td>0.05</td>
<td>4</td>
<td>12436.6</td>
<td>0:00:05.030</td>
</tr>
<tr>
<td>2500</td>
<td>0.05</td>
<td>10</td>
<td>18114.4</td>
<td>0:00:09.086</td>
</tr>
<tr>
<td>2500</td>
<td>0.05</td>
<td>25</td>
<td>19127.6</td>
<td>0:00:12.327</td>
</tr>
<tr>
<td>2500</td>
<td>0.05</td>
<td>50</td>
<td>19264.4</td>
<td>0:00:19.153</td>
</tr>
<tr>
<td>2500</td>
<td>0.1</td>
<td>25</td>
<td>65645.2</td>
<td>0:00:44.628</td>
</tr>
<tr>
<td>2500</td>
<td>0.1</td>
<td>10</td>
<td>62667.2</td>
<td>0:00:46.960</td>
</tr>
<tr>
<td>2500</td>
<td>0.1</td>
<td>4</td>
<td>45142.8</td>
<td>0:00:50.812</td>
</tr>
<tr>
<td>2500</td>
<td>0.1</td>
<td>50</td>
<td>66089.4</td>
<td>0:01:17.700</td>
</tr>
<tr>
<td>10000</td>
<td>0.005</td>
<td>25</td>
<td>189.6</td>
<td>0:00:00.103</td>
</tr>
<tr>
<td>10000</td>
<td>0.005</td>
<td>10</td>
<td>180</td>
<td>0:00:00.136</td>
</tr>
<tr>
<td>10000</td>
<td>0.005</td>
<td>50</td>
<td>190.8</td>
<td>0:00:00.195</td>
</tr>
<tr>
<td>10000</td>
<td>0.005</td>
<td>4</td>
<td>126.4</td>
<td>0:00:00.328</td>
</tr>
<tr>
<td>10000</td>
<td>0.05</td>
<td>4</td>
<td>12436.6</td>
<td>0:00:01.655</td>
</tr>
<tr>
<td>10000</td>
<td>0.05</td>
<td>10</td>
<td>18114.4</td>
<td>0:00:02.004</td>
</tr>
<tr>
<td>10000</td>
<td>0.05</td>
<td>50</td>
<td>19264.4</td>
<td>0:00:02.564</td>
</tr>
<tr>
<td>10000</td>
<td>0.05</td>
<td>25</td>
<td>19127.6</td>
<td>0:00:02.673</td>
</tr>
<tr>
<td>10000</td>
<td>0.1</td>
<td>4</td>
<td>45142.8</td>
<td>0:00:04.889</td>
</tr>
<tr>
<td>10000</td>
<td>0.1</td>
<td>25</td>
<td>65645.2</td>
<td>0:00:06.184</td>
</tr>
<tr>
<td>10000</td>
<td>0.1</td>
<td>10</td>
<td>62667.2</td>
<td>0:00:06.300</td>
</tr>
<tr>
<td>10000</td>
<td>0.1</td>
<td>50</td>
<td>66089.4</td>
<td>0:00:06.674</td>
</tr>
<tr>
<td>20000</td>
<td>0.005</td>
<td>50</td>
<td>190.8</td>
<td>0:00:00.107</td>
</tr>
<tr>
<td>20000</td>
<td>0.005</td>
<td>25</td>
<td>189.6</td>
<td>0:00:00.110</td>
</tr>
<tr>
<td>20000</td>
<td>0.005</td>
<td>10</td>
<td>180</td>
<td>0:00:00.112</td>
</tr>
<tr>
<td>20000</td>
<td>0.005</td>
<td>4</td>
<td>126.4</td>
<td>0:00:00.324</td>
</tr>
<tr>
<td>20000</td>
<td>0.05</td>
<td>4</td>
<td>12436.6</td>
<td>0:00:01.075</td>
</tr>
<tr>
<td>20000</td>
<td>0.05</td>
<td>10</td>
<td>18114.4</td>
<td>0:00:01.306</td>
</tr>
<tr>
<td>20000</td>
<td>0.05</td>
<td>25</td>
<td>19127.6</td>
<td>0:00:01.550</td>
</tr>
<tr>
<td>20000</td>
<td>0.05</td>
<td>50</td>
<td>19264.4</td>
<td>0:00:01.752</td>
</tr>
<tr>
<td>20000</td>
<td>0.1</td>
<td>4</td>
<td>45142.8</td>
<td>0:00:03.073</td>
</tr>
<tr>
<td>20000</td>
<td>0.1</td>
<td>10</td>
<td>62667.2</td>
<td>0:00:03.512</td>
</tr>
<tr>
<td>20000</td>
<td>0.1</td>
<td>25</td>
<td>65645.2</td>
<td>0:00:03.685</td>
</tr>
<tr>
<td>20000</td>
<td>0.1</td>
<td>50</td>
<td>66089.4</td>
<td>0:00:04.129</td>
</tr>
<tr>
<td>100000</td>
<td>0.005</td>
<td>25</td>
<td>189.6</td>
<td>0:00:00.107</td>
</tr>
<tr>
<td>100000</td>
<td>0.005</td>
<td>50</td>
<td>190.8</td>
<td>0:00:00.115</td>
</tr>
<tr>
<td>100000</td>
<td>0.005</td>
<td>10</td>
<td>180</td>
<td>0:00:00.138</td>
</tr>
<tr>
<td>100000</td>
<td>0.005</td>
<td>4</td>
<td>126.4</td>
<td>0:00:00.320</td>
</tr>
<tr>
<td>100000</td>
<td>0.05</td>
<td>4</td>
<td>12436.6</td>
<td>0:00:01.095</td>
</tr>
<tr>
<td>100000</td>
<td>0.05</td>
<td>10</td>
<td>18114.4</td>
<td>0:00:01.294</td>
</tr>
<tr>
<td>100000</td>
<td>0.05</td>
<td>25</td>
<td>19127.6</td>
<td>0:00:01.547</td>
</tr>
<tr>
<td>100000</td>
<td>0.05</td>
<td>50</td>
<td>19264.4</td>
<td>0:00:01.651</td>
</tr>
<tr>
<td>100000</td>
<td>0.1</td>
<td>4</td>
<td>45142.8</td>
<td>0:00:02.888</td>
</tr>
<tr>
<td>100000</td>
<td>0.1</td>
<td>10</td>
<td>62667.2</td>
<td>0:00:03.221</td>
</tr>
<tr>
<td>100000</td>
<td>0.1</td>
<td>25</td>
<td>65645.2</td>
<td>0:00:03.615</td>
</tr>
<tr>
<td>100000</td>
<td>0.1</td>
<td>50</td>
<td>66089.4</td>
<td>0:00:04.156</td>
</tr>
</tbody>
</table>
There are a few ways to slice the data.  It is easier to look at a slice with constant RU.  For instance RU = 2500:
<table border="3">
<thead>
<tr style="background:green;">
<th>RU</th>
<th>Radius</th>
<th>Edge Count</th>
<th># points</th>
<th>Elapsed</th>
</tr>
</thead>
<tbody>
<tr>
<td>2500</td>
<td>0.005</td>
<td>50</td>
<td>190.8</td>
<td>0:00:00.105</td>
</tr>
<tr>
<td>2500</td>
<td>0.005</td>
<td>25</td>
<td>189.6</td>
<td>0:00:00.110</td>
</tr>
<tr>
<td>2500</td>
<td>0.005</td>
<td>10</td>
<td>180</td>
<td>0:00:00.126</td>
</tr>
<tr>
<td>2500</td>
<td>0.005</td>
<td>4</td>
<td>126.4</td>
<td>0:00:00.365</td>
</tr>
<tr>
<td>2500</td>
<td>0.05</td>
<td>4</td>
<td>12436.6</td>
<td>0:00:05.030</td>
</tr>
<tr>
<td>2500</td>
<td>0.05</td>
<td>10</td>
<td>18114.4</td>
<td>0:00:09.086</td>
</tr>
<tr>
<td>2500</td>
<td>0.05</td>
<td>25</td>
<td>19127.6</td>
<td>0:00:12.327</td>
</tr>
<tr>
<td>2500</td>
<td>0.05</td>
<td>50</td>
<td>19264.4</td>
<td>0:00:19.153</td>
</tr>
<tr>
<td>2500</td>
<td>0.1</td>
<td>25</td>
<td>65645.2</td>
<td>0:00:44.628</td>
</tr>
<tr>
<td>2500</td>
<td>0.1</td>
<td>10</td>
<td>62667.2</td>
<td>0:00:46.960</td>
</tr>
<tr>
<td>2500</td>
<td>0.1</td>
<td>4</td>
<td>45142.8</td>
<td>0:00:50.812</td>
</tr>
<tr>
<td>2500</td>
<td>0.1</td>
<td>50</td>
<td>66089.4</td>
<td>0:01:17.700</td>
</tr>
</tbody>
</table>
The data here is sorted by elapsed time, i.e. the time the query took to return.

We can quickly see that the main driver for the performance is the number of documents returned.  If we plot one against the other:

<a href="assets/2017/10/cosmos-db-performance-with-geospatial-data/image7.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/10/cosmos-db-performance-with-geospatial-data/image_thumb7.png" alt="image" border="0" /></a>

Here we transformed the elapsed time in total milliseconds in order to get an integer value which is easier to plot (in Excel anyway).

We observe the relationship is actually linear.

Now let’s look at the effect of scaling the request units, i.e. the amount of compute dedicated to the collection.  Let’s take the slowest query and look at it executing with increasing RUs:
<table border="3">
<thead>
<tr style="background:green;">
<th>RU</th>
<th>Radius</th>
<th>Edge Count</th>
<th># points</th>
<th>Elapsed</th>
</tr>
</thead>
<tbody>
<tr>
<td>2500</td>
<td>0.1</td>
<td>50</td>
<td>66089.4</td>
<td>0:01:18.000</td>
</tr>
<tr>
<td>10000</td>
<td>0.1</td>
<td>50</td>
<td>66089.4</td>
<td>0:00:06.674</td>
</tr>
<tr>
<td>20000</td>
<td>0.1</td>
<td>50</td>
<td>66089.4</td>
<td>0:00:04.129</td>
</tr>
<tr>
<td>100000</td>
<td>0.1</td>
<td>50</td>
<td>66089.4</td>
<td>0:00:04.156</td>
</tr>
</tbody>
</table>
We can see that increasing RU from 2500 to 10000 improves the performance by an order of magnitude.  Doubling the RUs to 20000 improves only by %50 while going all the way to 100000 doesn’t yield improvement.

This is an important insight:  depending on the query, scaling might or might not improve performance notably.
<h2>Filtering</h2>
Some of the queries performed pretty slowly with low RUs.

As we observed those are the queries returning many points.

This might be necessary for an application but often we want to limit the number of returned value.  It is interesting to see that if we use another criteria in the where clause to limit the number of points returned, we drastically improve performance.

Let’s modify the test query to:

[code language="SQL"]

SELECT VALUE COUNT(1)
FROM record r
WHERE ST_WITHIN(
r.location,
{'type':'Polygon', 'coordinates':[@polyCoordinates]})
AND r.profile.age&lt;25

[/code]

The age property is randomly generated to be uniformly distributed between 0 and 99.  The filter we just put should shrink the result set by a factor 4.

It does:  where the preceding query was returning more than 66000 points and take close to 80 seconds to run, it now returns 16293 and take below 8 seconds to run.

Here we see the power of automatic indexing in Cosmos DB.
<h2>Second (and last) test:  proximity</h2>
For the second test our query is looking for points at proximity to a given poing:

[code language="SQL"]

SELECT
VALUE COUNT(1)
FROM record r
WHERE ST_DISTANCE (
r.location,
{'type':'Point', 'coordinates':@center})&lt;@radius

[/code]

The center and radius are passed in parameters here.

Again the query simply counts the number of point.

Here we simply took increasing radius value in order to compare performance.  Here is the raw data:
<table border="3">
<thead>
<tr style="background:orange;color:green;">
<th>RU</th>
<th>Radius</th>
<th># points</th>
<th>Elapsed</th>
</tr>
</thead>
<tbody>
<tr>
<td>2500</td>
<td>1000</td>
<td>896</td>
<td>0:00:00.533</td>
</tr>
<tr>
<td>2500</td>
<td>100</td>
<td>6.6</td>
<td>0:00:00.732</td>
</tr>
<tr>
<td>2500</td>
<td>3000</td>
<td>8109.8</td>
<td>0:00:03.249</td>
</tr>
<tr>
<td>2500</td>
<td>10000</td>
<td>68680.8</td>
<td>0:00:50.045</td>
</tr>
<tr>
<td>10000</td>
<td>1000</td>
<td>896</td>
<td>0:00:00.543</td>
</tr>
<tr>
<td>10000</td>
<td>100</td>
<td>6.6</td>
<td>0:00:00.724</td>
</tr>
<tr>
<td>10000</td>
<td>3000</td>
<td>8109.8</td>
<td>0:00:01.019</td>
</tr>
<tr>
<td>10000</td>
<td>10000</td>
<td>68680.8</td>
<td>0:00:05.698</td>
</tr>
<tr>
<td>20000</td>
<td>1000</td>
<td>896</td>
<td>0:00:00.518</td>
</tr>
<tr>
<td>20000</td>
<td>100</td>
<td>6.6</td>
<td>0:00:00.792</td>
</tr>
<tr>
<td>20000</td>
<td>3000</td>
<td>8109.8</td>
<td>0:00:00.964</td>
</tr>
<tr>
<td>20000</td>
<td>10000</td>
<td>68680.8</td>
<td>0:00:03.546</td>
</tr>
<tr>
<td>100000</td>
<td>100</td>
<td>6.6</td>
<td>0:00:00.664</td>
</tr>
<tr>
<td>100000</td>
<td>1000</td>
<td>896</td>
<td>0:00:00.679</td>
</tr>
<tr>
<td>100000</td>
<td>3000</td>
<td>8109.8</td>
<td>0:00:01.179</td>
</tr>
<tr>
<td>100000</td>
<td>10000</td>
<td>68680.8</td>
<td>0:00:03.499</td>
</tr>
</tbody>
</table>
We notice the same thing than in the first test:  the more points returned by the query, the longer it takes.

We also notice the same improvement from 2500 to 10000 RUs and then the marginal improvement by increasing further.
<h2>Summary</h2>
We did two main performance test for Cosmos DB geospatial queries:  polygon inclusion &amp; proximity.

The main conclusions were:
<ul>
 	<li>The more points returned, the longer the query takes</li>
 	<li>If we filter further the query, it returns less points and perform better</li>
 	<li>Scaling the Request Units (RUs) do improve performance but not in a linear fashion ; it is important to do performance test in order to properly invest in RUs</li>
 	<li>Cosmos DB does a great job at using its indexes and can perform well despite having a big volume of documents</li>
</ul>
We strongly suggest you run similar tests with metrics closer to your workload in order to understand the performance profile of your query.