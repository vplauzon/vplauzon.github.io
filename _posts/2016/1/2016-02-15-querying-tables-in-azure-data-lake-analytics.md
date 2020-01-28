---
title: Querying tables in Azure Data Lake Analytics
date: 2016-02-15 16:00:02 -08:00
permalink: /2016/02/15/querying-tables-in-azure-data-lake-analytics/
categories:
- Solution
tags:
- Big Data
---
<a href="http://vincentlauzon.com/2015/09/30/azure-data-lake-early-look/" target="_blank">Azure Data Lake</a> (both <a href="https://azure.microsoft.com/en-us/services/data-lake-store/" target="_blank">Storage</a> &amp; <a href="https://azure.microsoft.com/en-us/services/data-lake-analytics/" target="_blank">Analytics</a>) has been in public preview for a month or two.

You can get started by <a href="http://vincentlauzon.com/2016/01/03/azure-data-lake-analytics-quick-start/">reading this</a> or have a look at <a href="http://vincentlauzon.com/about/azure-data-lake/">Azure Data Lake series </a>for more posts on Azure Data Lake.

I thought I would kick some posts about more complex scenarios to display what’s possibile with that technology.

In my <a href="http://vincentlauzon.com/2016/01/13/azure-data-lake-analytics-loading-files-with-custom-c-code/">last post</a>, we did import data from the <a href="http://bioinfo.uib.es/~joemiro/marvel.html" target="_blank">Social characteristics of the Marvel Universe</a> data set into ADLA tables.  In this post, I will query those tables to get some insights out of them.
<h2>Data Model</h2>
The data model in the ADLA tables is the following:

<a href="/assets/posts/2016/1/querying-tables-in-azure-data-lake-analytics/image7.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="/assets/posts/2016/1/querying-tables-in-azure-data-lake-analytics/image_thumb7.png" alt="image" width="1042" height="482" border="0" /></a>
<h2>Popular Character</h2>
Obvious question:  which character is the most popular, i.e. which character has been published the most?

Let’s ask the question:

```sql
USE DATABASE Marvel;
 
//  Most popular characters
@characters =
    SELECT c.CharacterID,
           c.CharacterName,
           COUNT(cb.BookID) AS PublicationCount
    FROM Input.Character AS c
         INNER JOIN
             Input.CharacterBook AS cb
         ON cb.CharacterID == c.CharacterID
    GROUP BY c.CharacterID,
             c.CharacterName;
 
@charactersWithCount =
    SELECT *
    FROM @characters
    ORDER BY PublicationCount DESC
    FETCH FIRST 15 ROWS ONLY;
 
OUTPUT @charactersWithCount
TO "/Outputs/TopCharacters.tsv"
USING Outputters.Tsv();
 
```

We get the predictable result:
<ul>
	<li>SPIDER-MAN/PETER PARKER</li>
	<li>CAPTAIN AMERICA</li>
	<li>IRON MAN/TONY STARK</li>
	<li>THING/BENJAMIN J. GRIMM</li>
	<li>THOR/DR. DONALD BLAKE/SIGURD JARLSON II/JAKE OLSON/LOREN OLSON</li>
	<li>HUMAN TORCH/JOHNNY STORM</li>
	<li>MR. FANTASTIC/REED RICHARDS</li>
	<li>HULK/DR. ROBERT BRUCE BANNER</li>
	<li>WOLVERINE/LOGAN</li>
	<li>INVISIBLE WOMAN/SUE STORM RICHARDS</li>
	<li>BEAST/HENRY &amp;HANK&amp; P. MCCOY</li>
	<li>SCARLET WITCH/WANDA MAXIMOFF</li>
	<li>DR. STRANGE/STEPHEN STRANGE</li>
	<li>DAREDEVIL/MATT MURDOCK</li>
	<li>WATSON-PARKER, MARY JANE</li>
</ul>
<h2>Popular DUOs</h2>
Another obvious question is:  which 2 characters are published together the most?

```sql
USE DATABASE Marvel;
 
//  Most popular duo of characters
@duoCount =
    SELECT COUNT(cb1.BookID) AS PublicationCount,
           cb1.CharacterID AS CharacterID1,
           cb2.CharacterID AS CharacterID2
    FROM Input.CharacterBook AS cb1
         INNER JOIN
             Input.CharacterBook AS cb2
         ON cb1.BookID == cb2.BookID
         // Eliminate duos consisting of the same character
    WHERE cb1.CharacterID != cb2.CharacterID
         // Making sure the same duo will be there only once
         AND cb1.CharacterID < cb2.CharacterID
    GROUP BY cb1.CharacterID,
             cb2.CharacterID;
 
@sortedDuos =
    SELECT dc.CharacterID1,
           c1.CharacterName AS CharacterName1,
           dc.CharacterID2,
           c2.CharacterName AS CharacterName2,
           dc.PublicationCount
    FROM @duoCount AS dc
         INNER JOIN
             Input.Character AS c1
         ON c1.CharacterID == dc.CharacterID1
         INNER JOIN
             Input.Character AS c2
         ON c2.CharacterID == dc.CharacterID2
    ORDER BY PublicationCount DESC
    FETCH FIRST 15 ROWS ONLY;
 
OUTPUT @sortedDuos
TO "/Outputs/TopDuos.tsv"
USING Outputters.Tsv();
```

Again, if you know the Marvel Universe, the results make sense:
<ul>
	<li>HUMAN TORCH/JOHNNY STORM &amp; THING/BENJAMIN J. GRIMM</li>
	<li>HUMAN TORCH/JOHNNY STORM &amp; MR. FANTASTIC/REED RICHARDS</li>
	<li>MR. FANTASTIC/REED RICHARDS &amp; THING/BENJAMIN J. GRIMM</li>
	<li>INVISIBLE WOMAN/SUE STORM RICHARDS &amp; MR. FANTASTIC/REED RICHARDS</li>
	<li>HUMAN TORCH/JOHNNY STORM &amp; INVISIBLE WOMAN/SUE STORM RICHARDS</li>
	<li>INVISIBLE WOMAN/SUE STORM RICHARDS &amp; THING/BENJAMIN J. GRIMM</li>
	<li>SPIDER-MAN/PETER PARKER &amp; WATSON-PARKER, MARY JANE</li>
	<li>JAMESON, J. JONAH &amp; SPIDER-MAN/PETER PARKER</li>
	<li>CAPTAIN AMERICA &amp; IRON MAN/TONY STARK</li>
	<li>SCARLET WITCH/WANDA MAXIMOFF &amp; VISION</li>
	<li>ANT-MAN/DR. HENRY J. PYM &amp; WASP/JANET VAN DYNE PYM</li>
	<li>CYCLOPS/SCOTT SUMMERS &amp; MARVEL GIRL/JEAN GREY SUMMERS</li>
	<li>STORM/ORORO MUNROE Subscribe! &amp; WOLVERINE/LOGAN</li>
	<li>CAPTAIN AMERICA &amp; THOR/DR. DONALD BLAKE/SIGURD JARLSON II/JAKE OLSON/LOREN OLSON</li>
	<li>CAPTAIN AMERICA &amp; VISION</li>
</ul>
<h2>Conclusion</h2>
We’ve seen how to do simple analytics using USQL on ADLA tables.

The data set I’m using is relatively small but with a Big Data set, the power of Hadoop opens lots of possibilities.

You can explore your data until you find some queries that make sense.  This means you can very easily explore big data set without provisionning servers or even VMs.