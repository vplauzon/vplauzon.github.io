---
title: Departmental Application Migration to Azure – Part 1
date: 2010-06-02 08:48:39 -07:00
permalink: /2010/06/02/departmental-application-migration-to-azure-part-1/
categories:
- Solution
tags: []
---
<p>I’m currently looking at how Windows Azure could help my company.&#160; As a proof-of-concept, I’m going to migrate a departmental application to Windows Azure.</p>  <p>The application is quite simple, but the migration should contain its share of challenges.&#160; The current application is a simple MS Access front-end exposing a few forms.&#160; The data source is an SQL Server Database.&#160; It uses the identity of the user to write some data (e.g. user name) to SQL tables.</p>  <p>My a priori approach, or target solution architecture is:</p>  <ul>   <li>Use SQL Azure to host the database</li>    <li>Use two SQL account, a read-only one for reporting from on-premise, one writeable in-use by the application only</li>    <li>Use ADFS v2.0 to extend the corporate identity to the cloud</li>    <ul>     <li>I’ll try to install it on a local VM for demo</li>   </ul>    <li>Build a web application as one web role accessing the DB directly</li> </ul>  <p>I suspect the biggest challenge will come from ADFS, partly because I’m no AD-expert, partly because it’s new and there is little documentation around.</p>  <p>I’ll write blogs as I go along.&#160; I’m doing many other things at the same time and that migration is actually low-priority, so it will most likely take a few weeks.&#160; I’ll link the blogs together.</p>