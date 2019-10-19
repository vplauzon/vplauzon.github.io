---
title: 'Entity Framework Patterns: Select Multiple Entities'
date: 2010-12-16 19:38:00 -05:00
permalink: /2010/12/16/entity-framework-patterns-select-multiple-entities/
categories:
- Solution
tags:
- .NET
---
<p>I just published another new article on code project:</p>  <p><a title="http://www.codeproject.com/KB/linq/EFPatternsSelectMultiples.aspx" href="http://www.codeproject.com/KB/linq/EFPatternsSelectMultiples.aspx">http://www.codeproject.com/KB/linq/EFPatternsSelectMultiples.aspx</a></p>  <p>It’s still pending for reviews.</p>  <p>I thought I could start teasing out some Entity Framework patterns for non-trivial scenarios.</p>  <p>In this case, I’m trying to address the scenario where you want to select a given list of entities (you’re given the list of IDs of those entities).&#160; I propose 4 approaches given their pros &amp; cons and in which situation it makes sense to use them:</p>  <ul>   <li>Selecting each entity one at the time </li>    <li>Doing a union via EF </li>    <li>Doing a where-in via EF </li>    <li>Joining on another table </li> </ul>  <p>As usual, I welcome feedback!</p>