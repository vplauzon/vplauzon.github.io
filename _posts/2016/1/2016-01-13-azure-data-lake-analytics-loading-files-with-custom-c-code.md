---
title: Azure Data Lake Analytics - Loading files with custom C# code
date: 2016-01-13 19:00:56 -05:00
permalink: /2016/01/13/azure-data-lake-analytics-loading-files-with-custom-c-code/
categories:
- Solution
tags:
- Big Data
---
<b><i>UPDATE (19-01-2016):  Have a look at <a href="http://vincentlauzon.com/about/azure-data-lake/"><b><i>Azure Data Lake series </i></b></a><b><i>for more posts on Azure Data Lake.</i></b></i></b>

<a href="http://vincentlauzon.com/2015/09/30/azure-data-lake-early-look/">Azure Data Lake</a> (both <a href="https://azure.microsoft.com/en-us/services/data-lake-store/" target="_blank">Storage</a> &amp; <a href="https://azure.microsoft.com/en-us/services/data-lake-analytics/" target="_blank">Analytics</a>) has been in public preview for a month or two.

You can get started by <a href="http://vincentlauzon.com/2016/01/03/azure-data-lake-analytics-quick-start/">reading this</a>.

I thought I would kick some posts about more complex scenarios to display what’s possibile with that technology.

In this post, I will load data from custom format files into Azure Data Lake Analytics (ADLA) tables.  This is the first step before running some analytics on the data.  It is the <a href="http://vincentlauzon.com/2015/12/28/checkpoints-in-etl/">first checkpoint</a> of the process.

When I say custom format file, I mean files that do not fall in the CSV / TSV / delimited file format.  This will lead us to explore how to use C# to do part of the parsing.

I won’t lie to you:  the product has a few rough edges in its first version of Public Preview, so I hope this post helps you find your destination faster!
<h2>Visual Studio Projects</h2>
In order to do this post, I’ve created a solution in Visual Studio with a <em>U-SQL Project</em> &amp; a <em>Class Library (For U-SQL Application)</em> project.  Here are the final file structure of the solution:

<a href="/assets/2016/1/azure-data-lake-analytics-loading-files-with-custom-c-code/image6.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="/assets/2016/1/azure-data-lake-analytics-loading-files-with-custom-c-code/image_thumb6.png" alt="image" width="505" height="505" border="0" /></a>

We’ll go through it in this post.

So the plan here is to persists the three tables into three ADLA tables, following the <a href="http://vincentlauzon.com/2015/12/28/checkpoints-in-etl/">checkpoint patterns</a>.
<h2>Data set</h2>
I looked for some big data set and struggled a bit.  I either found tiny data sets with the equivalent of one-table or huge ones (multiple TB) which are a bit prohebitive for proof-of-concepts (POC) such as this post.

I settled for a fun one I found on <a href="http://aws.amazon.com/datasets/marvel-universe-social-graph/" target="_blank">Amazon AWS</a>:  <em><a href="http://bioinfo.uib.es/~joemiro/marvel.html" target="_blank">Social characteristics of the Marvel Universe</a></em>.  It’s basically a data set about which Marvel characters appear in which comic books.

It is a non-trivial size but by no mean <strong>big</strong> data set.  So using Hadoop, a big compute engine, on it is a bit of an overkill but it’s for POC, isn’t it?

It has three parts:
<ul>
	<li><a href="http://bioinfo.uib.es/~joemiro/marvel/vert1.txt" target="_blank">Marvel characters</a></li>
	<li><a href="http://bioinfo.uib.es/~joemiro/marvel/vert2.txt" target="_blank">Marvel comic books</a></li>
	<li><a href="http://bioinfo.uib.es/~joemiro/marvel/porgat.txt" target="_blank">Relationship between the two</a></li>
</ul>
<img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" src="http://icons.iconarchive.com/icons/ampeross/qetto-2/64/danger-icon.png" alt="" align="left" border="0" />Those files have some <a href="https://en.wikipedia.org/wiki/Byte_order_mark">Byte Order Mark</a> (BOM) at the beginning to make things interesting.  Unfortunately at this point, this blows up in the USQL parsing.  The easiest way to remove the BOMs is to download the files locally, open them in Visual Studio, “Save As…”, then hit the arrow next to the save in the dialog box:

<a href="/assets/2016/1/azure-data-lake-analytics-loading-files-with-custom-c-code/image3.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="/assets/2016/1/azure-data-lake-analytics-loading-files-with-custom-c-code/image_thumb3.png" alt="image" width="147" height="61" border="0" /></a>

choose “Save with Encoding…”, choose UTF-8 without signature and save them.

<a href="/assets/2016/1/azure-data-lake-analytics-loading-files-with-custom-c-code/image4.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="/assets/2016/1/azure-data-lake-analytics-loading-files-with-custom-c-code/image_thumb4.png" alt="image" width="612" height="337" border="0" /></a>

While we are at it, for the last file, i.e. <em>porgat.txt</em>, we’ll need to remove the first part of the file.  Search for “*Edgeslist” and delete everything before it.  The file should now start with “1 6487”.

Let’s call those pre-processing…

Let’s copy those three files under your ADLS in one <em>Marvel</em> folder.

I won’t cover the basics-basics, please read <a href="https://azure.microsoft.com/en-us/documentation/articles/data-lake-store-get-started-portal/" target="_blank">Logistic / Get Started</a>.
<h2>Create Database script</h2>
I want to put all the tables inside a database container so let’s create a database with two schemas:  one for the raw input files (as tables) and one for analytics (I’ll use it in a future post only).

In the <em>CreateDbAndSchemas.usql </em>file, let’s put the following content:

[code language="sql"]
//  This drops the database (with its data) before recreating it
DROP DATABASE IF EXISTS Marvel;

//  Create a database
CREATE DATABASE Marvel;

//  Use the new database as the current
USE DATABASE Marvel;

//  Create two schemas
CREATE SCHEMA Input;
CREATE SCHEMA Analytic;
[/code]

Remember USQL keywords must be uppercase in order not conflict with C# (e.g. SELECT vs select in Linq / C#).

You can submit that as a job and validate in the portal that the database is created.  You will not see the schemas there yet though.
<h2>Handling custom format:  function</h2>
I’ve tried different approach before seattling for this one.

Basically, the first two files share the same format while the latter has a different one.  I didn’t want to repeat the code for the first two files.

We could invoke some C# codes twice but I found that using an USQL function, itself invoking C# methods, to be the most elegant.

I fully covered <a href="http://vincentlauzon.com/2016/01/06/registering-assemblies-in-azure-data-lake-analytics/">how to register assemblies in this post</a>.  For this, since we are invoking C# code from within a function, we are going to use the Visual Studio Register Assembly option.  The C# code is going to reside in a separate assembly.
<h2>Vertex Format</h2>
Let’s look at the first format, which I called the <em>vertex</em> format.  Here’s the beginning of <em>vert1.txt</em>:

[code language="text"]
Vertex 1: 24-HOUR MAN/EMMANUEL
Vertex 2: 3-D MAN/CHARLES CHANDLER &amp; HAROLD CHANDLER
Vertex 3: 4-D MAN/MERCURIO
Vertex 4: 8-BALL/
[/code]

The format is pretty obvious but it also doesn’t comply with any format supported by USQL extractors, i.e. it isn’t comma or tab separated…  This is why we’re going to use C# code to parse it.  The most elegant way is to use a regular expression to parse and extract the data.  Here is the C# helper class to accomplish that:

[code language="csharp"]
using System.Text.RegularExpressions;

namespace MarvelLib
{
  /// &lt;summary&gt;Helper class containing methods parsing a vertex format file.&lt;/summary&gt;
  public static class VertexFormatHelper
  {
    private static readonly Regex _regex = new Regex(@&quot;^\s*Vertex\s*(?&lt;id&gt;\d*)\s*:\s*(?&lt;label&gt;.*)\s*$&quot;);

    /// &lt;summary&gt;Predicate returning &lt;c&gt;true&lt;/c&gt; iif a line of text is in the vertex format.&lt;/summary&gt;
    /// &lt;param name=&quot;line&quot;&gt;Input line of text.&lt;/param&gt;
    /// &lt;returns&gt;&lt;/returns&gt;
    public static bool IsVertexMatch(string line)
    {
      return _regex.IsMatch(line);
    }

    /// &lt;summary&gt;Get the ID from a vertex line.&lt;/summary&gt;
    /// &lt;param name=&quot;line&quot;&gt;Input line of text.&lt;/param&gt;
    /// &lt;returns&gt;ID of the vertex&lt;/returns&gt;
    public static int GetID(string line)
    {
      var idText = _regex.Match(line).Groups[&quot;id&quot;].Value;

      return int.Parse(idText);
    }

    /// &lt;summary&gt;Get the label from a vertex line.&lt;/summary&gt;
    /// &lt;param name=&quot;line&quot;&gt;Input line of text.&lt;/param&gt;
    /// &lt;returns&gt;Label of the vertex.&lt;/returns&gt;
    public static string GetLabel(string line)
    {
      var label = _regex.Match(line).Groups[&quot;label&quot;].Value;

      return label;
    }
  }
}
[/code]

The Function consuming this is the following:

[code language="sql"]
CREATE FUNCTION Input.GetVertexData(@fileSet string)
RETURNS @vertexData TABLE
(
  VertexID int,
  VertexLabel string
)
AS BEGIN
REFERENCE ASSEMBLY MarvelLib;

//  Extract the data with no schema, i.e. whole line
@lines =
  EXTRACT Line string
  FROM @fileSet
  // Hack in order not to have the extractor delimitate columns
  USING Extractors.Text(delimiter : '$');

//  Give the query a schema on read
@vertexData =
  //  Extract the vertex id &amp; label from the line
  SELECT MarvelLib.VertexFormatHelper.GetID(Line) AS VertexID,
  MarvelLib.VertexFormatHelper.GetLabel(Line) AS VertexLabel
  FROM @lines
  WHERE MarvelLib.VertexFormatHelper.IsVertexMatch(Line);

RETURN;
END;
[/code]

The function takes a string in parameter representing a <em>file set</em>.  A file set in U-SQL is either a file path or an expression representing multiple files (typically with ‘*’).

Notice the reference assembly operation within the body of the function.  This is necessary to use the C# method defined in that assembly.

The first expression parses the text file into rows.  We use a little hack to parse an entire row (line) at the time since U-SQL (at this point in time) doesn’t support to load one line at the time directly.

In the second expression we use the C# method to extract the ID and the label in each line.

The second expression is what is returned by the function.  We’ll see how we’ll further transform the expression.
<h2>Relation Format</h2>
Let’s look at the second format, which I called the <em>relation</em> format.  Here’s the beginning of <em>porgat.txt</em>:

[code language="text"]
1 6487
2 6488 6489 6490 6491 6492 6493 6494 6495 6496
3 6497 6498 6499 6500 6501 6502 6503 6504 6505
4 6506 6507 6508
[/code]

Again the format is pretty straightforward but isn’t directly supported by U-SQL Extractors.

We’re going to use the following C# class (simply splitting the line on spaces) to help us out:

[code language="csharp"]
using Microsoft.Analytics.Types.Sql;
using System.Linq;

namespace MarvelLib
{
  public static class RelationFormatHelper
  {
    public static bool IsRelationMatch(string line)
    {
      var parts = line.Split(' ');

      return parts.Length != 0;
    }

    public static int GetID(string line)
    {
      var parts = line.Split(' ');

      return int.Parse(parts[0].Trim());
    }

    public static SqlArray&lt;int&gt; GetRelations(string line)
    {
      var parts = line.Split(' ');
      var relations = from p in parts.Skip(1)
                      select int.Parse(p);

      return SqlArray.Create(relations);
    }
  }
}
[/code]

The function consuming this code is:

[code language="sql"]
CREATE FUNCTION Input.GetRelationData(@fileSet string)
RETURNS @relationData TABLE
(
  MainID int,
  RelationID int
)
AS BEGIN
REFERENCE ASSEMBLY MarvelLib;

//  Extract the data with no schema, i.e. whole line
@lines =
  EXTRACT Line string
  FROM @fileSet
  // Hack in order not to have the extractor delimitate columns
  USING Extractors.Text(delimiter : '$');

//  Give the query a schema on read
@flatRelations =
  //  Extract the main id &amp; the relations (as an array) from the line
  SELECT MarvelLib.RelationFormatHelper.GetID(Line) AS MainID,
        //   This is a SQL.Array&lt;int&gt;, a special U-SQL type
        MarvelLib.RelationFormatHelper.GetRelations(Line) AS RelationIDs
  FROM @lines
  WHERE MarvelLib.RelationFormatHelper.IsRelationMatch(Line);

//  Here we're gona unpack the relation IDs array on to many rows
@relationData =
  SELECT MainID,
          rid AS RelationID
  FROM @flatRelations
  CROSS APPLY EXPLODE (RelationIDs) AS r(rid);

RETURN;
END;
[/code]

In the first expression we parse the lines of the file.

In the second expression, we use the C# methods to extract the main ID and the list of relation IDs as an SQL Array.

In the third expression, we explode the array of relation IDs on different rows.  I covered the CROSS APPLY EXPLODE in the <a href="http://vincentlauzon.com/2016/01/10/u-sql-cross-apply/" target="_blank">following post</a>.

The complete content of <em>CreateFormatFunctions.usql</em> is the following:

[code language="sql"]
USE DATABASE Marvel;

DROP FUNCTION IF EXISTS Input.GetVertexData;
DROP FUNCTION IF EXISTS Input.GetRelationData;

CREATE FUNCTION Input.GetVertexData(@fileSet string)
RETURNS @vertexData TABLE
(
  VertexID int,
  VertexLabel string
)
AS BEGIN
REFERENCE ASSEMBLY MarvelLib;

//  Extract the data with no schema, i.e. whole line
@lines =
  EXTRACT Line string
  FROM @fileSet
  // Hack in order not to have the extractor delimitate columns
  USING Extractors.Text(delimiter : '$');

//  Give the query a schema on read
@vertexData =
  //  Extract the vertex id &amp; label from the line
  SELECT MarvelLib.VertexFormatHelper.GetID(Line) AS VertexID,
  MarvelLib.VertexFormatHelper.GetLabel(Line) AS VertexLabel
  FROM @lines
  WHERE MarvelLib.VertexFormatHelper.IsVertexMatch(Line);

RETURN;
END;

CREATE FUNCTION Input.GetRelationData(@fileSet string)
RETURNS @relationData TABLE
(
  MainID int,
  RelationID int
)
AS BEGIN
REFERENCE ASSEMBLY MarvelLib;

//  Extract the data with no schema, i.e. whole line
@lines =
  EXTRACT Line string
  FROM @fileSet
  // Hack in order not to have the extractor delimitate columns
  USING Extractors.Text(delimiter : '$');

//  Give the query a schema on read
@flatRelations =
  //  Extract the main id &amp; the relations (as an array) from the line
  SELECT MarvelLib.RelationFormatHelper.GetID(Line) AS MainID,
  //   This is a SQL.Array&lt;int&gt;, a special U-SQL type
  MarvelLib.RelationFormatHelper.GetRelations(Line) AS RelationIDs
  FROM @lines
  WHERE MarvelLib.RelationFormatHelper.IsRelationMatch(Line);

//  Here we're gona unpack the relation IDs array on to many rows
@relationData =
  SELECT MainID,
         rid AS RelationID
  FROM @flatRelations
  CROSS APPLY EXPLODE (RelationIDs) AS r(rid);

RETURN;
END;
[/code]

You can submit the script as a job.  This will create the two functions.
<h2>Bringing it all together:  importing the data</h2>
We’ve built all the tools to easily import the files into ADLA tables.

In the file <em>ImportData.usql</em>:

[code language="sql"]
USE DATABASE Marvel;

//  Load row sets
@characterVertices = Input.GetVertexData
                     (
                         &quot;/Marvel/vert1.txt&quot;
                     );
@bookVertices = Input.GetVertexData
                (
                    &quot;/Marvel/vert2.txt&quot;
                );
@characterBookIDs = Input.GetRelationData
                    (
                        &quot;/Marvel/porgat.txt&quot;
                    );

//  Schema on read:  project the generic schema into a specific one for characters
@characters =
    SELECT VertexID AS CharacterID,
           VertexLabel AS CharacterName
    FROM @characterVertices;
//  Schema on read:  project the generic schema into a specific one for books
@books =
    SELECT VertexID AS BookID,
           VertexLabel AS BookName
    FROM @bookVertices;
//  Schema on read:  project the generic schema into a specific one for books-characters
@characterBooks =
    SELECT MainID AS CharacterID,
           RelationID AS BookID
    FROM @characterBookIDs;

//  Drop the tables before recreating them to load data
DROP TABLE IF EXISTS Input.Character;
DROP TABLE IF EXISTS Input.Book;
DROP TABLE IF EXISTS Input.CharacterBook;

//  Create the character table as a managed table with a query
CREATE TABLE Input.Character
(
    INDEX CharacterIndex
    CLUSTERED(CharacterID ASC)
    PARTITIONED BY
    RANGE(CharacterID)
) AS
SELECT *
FROM @characters;

//  Create the book table as a managed table with a query
CREATE TABLE Input.Book
(
    INDEX BookIndex
    CLUSTERED(BookID ASC)
    PARTITIONED BY
    RANGE(BookID)
) AS
SELECT *
FROM @books;

//  Create the character-book relation table as a managed table with a query
CREATE TABLE Input.CharacterBook
(
    INDEX CharacterBookIndex
    CLUSTERED(CharacterID, BookID ASC)
    PARTITIONED BY
    RANGE(CharacterID, BookID)
) AS
SELECT *
FROM @characterBooks;
[/code]

The script is pretty straightforward.  The patterns used are:
<ul>
	<li>Schema on read:  we parse files and we defined schema while reading the files</li>
	<li><a href="http://vincentlauzon.com/2015/12/28/checkpoints-in-etl/">Checkpoint</a>:  we save the data into a table before doing further analytics on the data (out of scope for this post)</li>
</ul>
<h2>Conclusion</h2>
We covered a lot of material and I hope it is useful to author your scripts.

We demonstrated the power of C# code to parse files having non-trivial format.  The result is a row-set we can further manipulate with projections and others.

We also persist the data into indexed &amp; partitionned ADLA tables.  This is useful because we’ll be able to run analytics on the data (in future posts) without processing the data from scratch.