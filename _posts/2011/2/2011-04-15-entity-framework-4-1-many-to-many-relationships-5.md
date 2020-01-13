---
title: 'Entity Framework 4.1: Many to Many Relationships (5)'
date: 2011-04-15 17:05:00 -07:00
permalink: /2011/04/15/entity-framework-4-1-many-to-many-relationships-5/
categories:
- Solution
tags:
- .NET
---
<p>This is part of a series of blog post about Entity Framework 4.1.&#160; The past blog entries are:</p>  <ul>   <li><a href="http://vincentlauzon.wordpress.com/2011/04/03/entity-framework-4-1-basics-1/">Basics (1)</a> </li>    <li><a href="http://vincentlauzon.wordpress.com/2011/04/06/entity-framework-4-1-override-conventions-2/">Override conventions (2)</a> </li>    <li><a href="http://vincentlauzon.wordpress.com/2011/04/11/entity-framework-4-1-deep-fetch-vs-lazy-load-3/">Deep Fetch vs Lazy Load (3)</a> </li>    <li><a href="http://vincentlauzon.wordpress.com/2011/04/13/entity-framework-4-1-complex-types-4/">Complex Types (4)</a></li> </ul>  <p>In this article, I’ll cover the many to many relationships.</p>  <p>Let’s start with the easiest case, we’ll let EF infer the table mapping.&#160; I model a many-to-many relationship between order and employee:</p>  <blockquote>   <p>public class Order     <br />{      <br />&#160;&#160;&#160; public int OrderID { get; set; }      <br />&#160;&#160;&#160; [Required]      <br />&#160;&#160;&#160; [StringLength(32, MinimumLength = 2)]      <br />&#160;&#160;&#160; public string OrderTitle { get; set; }      <br />&#160;&#160;&#160; [Required]      <br />&#160;&#160;&#160; [StringLength(64, MinimumLength=5)]      <br />&#160;&#160;&#160; public string CustomerName { get; set; }      <br />&#160;&#160;&#160; public DateTime TransactionDate { get; set; }      <br />&#160;&#160;&#160; public byte[] TimeStamp { get; set; } </p>    <p>&#160;&#160;&#160; public virtual List&lt;OrderDetail&gt; OrderDetails { get; set; }     <br />&#160;&#160;&#160; public virtual List&lt;Employee&gt; InvolvedEmployees { get; set; }      <br />} </p>    <p>public class Employee     <br />{      <br />&#160;&#160;&#160; public int EmployeeID { get; set; }      <br />&#160;&#160;&#160; public string EmployeeName { get; set; } </p>    <p>&#160;&#160;&#160; public virtual List&lt;Order&gt; Orders { get; set; }     <br />} </p> </blockquote>  <p>I simply put a list of employees in order and a list of orders in employee.&#160; Voila!&#160; Here are the mapped tables:</p>  <p><a href="/assets/posts/2011/2/entity-framework-4-1-many-to-many-relationships-5/image1.png"><img style="border-bottom:0;border-left:0;display:inline;border-top:0;border-right:0;" title="image" border="0" alt="image" src="/assets/posts/2011/2/entity-framework-4-1-many-to-many-relationships-5/image_thumb1.png" width="798" height="416" /></a> </p>  <p>Now, we might want to control two things:</p>  <ul>   <li>The name of the relation table</li>    <li>The name of the two columns in the relation table</li> </ul>  <p>This can all be done with the following code:</p>  <blockquote>   <p>modelBuilder.Entity&lt;Employee&gt;()     <br />&#160;&#160;&#160; .HasMany(e =&gt; e.Orders)      <br />&#160;&#160;&#160; .WithMany(e =&gt; e.InvolvedEmployees)      <br />&#160;&#160;&#160; .Map(m =&gt;      <br />&#160;&#160;&#160; {      <br />&#160;&#160;&#160;&#160;&#160;&#160;&#160; m.ToTable(&quot;EmployeeOrder&quot;);      <br />&#160;&#160;&#160;&#160;&#160;&#160;&#160; m.MapLeftKey(&quot;EmployeeID&quot;);      <br />&#160;&#160;&#160;&#160;&#160;&#160;&#160; m.MapRightKey(&quot;OrderID&quot;);      <br />&#160;&#160;&#160; }); </p> </blockquote>  <p>Basically, we say that an <em>employee</em> as many orders, that each employee has many orders (hence we have a many-to-many relationship).&#160; We then go and say that the relation table should be named <em>EmployeeOrder</em>, the left key (from <em>employee</em> perspective, so the employee key) should be named <em>employee-id</em> and the right key <em>order-id</em>:</p>  <p><a href="/assets/posts/2011/2/entity-framework-4-1-many-to-many-relationships-5/image2.png"><img style="border-bottom:0;border-left:0;display:inline;border-top:0;border-right:0;" title="image" border="0" alt="image" src="/assets/posts/2011/2/entity-framework-4-1-many-to-many-relationships-5/image_thumb2.png" width="792" height="413" /></a> </p>  <p>So there you go, you can control a table that doesn’t directly map to a class.</p>  <p>In terms of using such a model, it is quite straightforward and natural:</p>  <blockquote>   <p>private static void ManyToMany()     <br />{      <br />&#160;&#160;&#160; using (var context = new MyDomainContext())      <br />&#160;&#160;&#160; {      <br />&#160;&#160;&#160;&#160;&#160;&#160;&#160; var order = new Order      <br />&#160;&#160;&#160;&#160;&#160;&#160;&#160; {      <br />&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160; OrderTitle = &quot;Pens&quot;,      <br />&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160; CustomerName = &quot;Mcdo's&quot;,      <br />&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160; TransactionDate = DateTime.Now,      <br />&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160; InvolvedEmployees = new List&lt;Employee&gt;()      <br />&#160;&#160;&#160;&#160;&#160;&#160;&#160; };      <br />&#160;&#160;&#160;&#160;&#160;&#160;&#160; var employee1 = new Employee { EmployeeName = &quot;Joe&quot;, Orders = new List&lt;Order&gt;() };      <br />&#160;&#160;&#160;&#160;&#160;&#160;&#160; var employee2 = new Employee { EmployeeName = &quot;Black&quot;, Orders = new List&lt;Order&gt;() }; </p>    <p>&#160;&#160;&#160;&#160;&#160;&#160;&#160; context.Orders.Add(order); </p>    <p>&#160;&#160;&#160;&#160;&#160;&#160;&#160; order.InvolvedEmployees.Add(employee1);     <br />&#160;&#160;&#160;&#160;&#160;&#160;&#160; order.InvolvedEmployees.Add(employee2); </p>    <p>&#160;&#160;&#160;&#160;&#160;&#160;&#160; context.SaveChanges();     <br />&#160;&#160;&#160; } </p> </blockquote>  <p>In this example I didn’t even bother to add the employees in the employees collection of the data context:&#160; EF took care of that for me since they were referenced in a collection.</p>