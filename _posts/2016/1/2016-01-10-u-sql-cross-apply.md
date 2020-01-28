---
title: U-SQL Cross Apply
date: 2016-01-10 16:00:40 -08:00
permalink: /2016/01/10/u-sql-cross-apply/
categories:
- Solution
tags:
- Big Data
---
<b><i>UPDATE (19-01-2016):  Have a look at <a href="http://vincentlauzon.com/about/azure-data-lake/"><b><i>Azure Data Lake series </i></b></a><b><i>for more posts on Azure Data Lake.</i></b></i></b>

<a href="http://vincentlauzon.com/2015/09/30/azure-data-lake-early-look/" target="_blank">Azure Data Lake</a> (both <a href="https://azure.microsoft.com/en-us/services/data-lake-store/" target="_blank">Storage</a> &amp; <a href="https://azure.microsoft.com/en-us/services/data-lake-analytics/" target="_blank">Analytics</a>) has been in public preview for a month or two.

You can get started by <a href="http://vincentlauzon.com/2016/01/03/azure-data-lake-analytics-quick-start/">reading this</a>.

I thought I would kick some posts about more complex scenarios to display what’s possibile with that technology.

In this post I’ll write about a specific U-SQL operation since its syntax is a bit tricky.
<h2>The Problem</h2>
U-SQL supports arrays in the form of the .NET type <em>SQL.Array&lt;T&gt;</em>.  This is very convenient in many scenarios, especially when you are parsing inputs.

We often want to take an array and <em>explode </em>it on different rows.  This is useful not only with arrays but with SQL.MAP&lt;T,V&gt;, or other complex types, e.g. XML or JSON.

This is accomplished by using the <a href="https://msdn.microsoft.com/en-us/library/azure/mt621307.aspx" target="_blank">CROSS APPLY &amp; EXPLODE</a> operators.
<h2>The Solution</h2>
Let’s look at the solution.

```sql

@content =
	SELECT *
	FROM(
		VALUES
		(
			12,
			"a, b, c"
		),
		(
			75,
			"f, g, h, i, j"
		)) AS t([ID], LetterList);

@inArray =
	SELECT [ID],
		SqlArray.Create(LetterList.Split(',')) AS LetterArray
	FROM @content;

@exploded =
	SELECT [ID],
		letter.Trim() AS Letter
	FROM @inArray
	CROSS APPLY
	EXPLODE(LetterArray) AS r(letter);

OUTPUT @exploded
TO "/Outputs/explosion.tsv"
USING Outputters.Tsv();
```

In the first expression, I create a table from a string:
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th>ID</th>
<th>LetterList</th>
</tr>
</thead>
<tbody>
<tr>
<td>12</td>
<td>"a, b, c"</td>
</tr>
<tr>
<td>75</td>
<td>"f, g, h, j, k"</td>
</tr>
</tbody>
</table>
In the second expression, I transform the second column into an array:
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th>ID</th>
<th>LetterList</th>
</tr>
</thead>
<tbody>
<tr>
<td>12</td>
<td>{"a", " b", " c"}</td>
</tr>
<tr>
<td>75</td>
<td>{"f", " g", " h", " j", " k"}</td>
</tr>
</tbody>
</table>
In the third and final expression, I explode the arrays on different rows (and trim the string to remove trailing spaces):
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th>ID</th>
<th>Letter</th>
</tr>
</thead>
<tbody>
<tr>
<td>12</td>
<td>"a"</td>
</tr>
<tr>
<td>12</td>
<td>"b"</td>
</tr>
<tr>
<td>12</td>
<td>"c"</td>
</tr>
<tr>
<td>75</td>
<td>"f"</td>
</tr>
<tr>
<td>75</td>
<td>"g"</td>
</tr>
<tr>
<td>75</td>
<td>"h"</td>
</tr>
<tr>
<td>75</td>
<td>"i"</td>
</tr>
<tr>
<td>75</td>
<td>"j"</td>
</tr>
</tbody>
</table>
Once you know it the syntax is pretty simple but it isn’t trivial to deduce that from the documentation, hence this post.
<h2>Conclusion</h2>
Very useful to basically pivot raw arrays to rows, CROSS APPLY with EXPLODE is another tool to help you parse semi-structured data into structured data (tables).