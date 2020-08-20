---
title:  Change Management in a Kusto Database
permalink: /2020/08/26/change-management-kusto
image:  /assets/posts/2020/3/change-management-kusto/moving-boxes.jpg
categories:
- Solution
tags:
- Data
- Operation
---
<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/3/change-management-kusto/moving-boxes.jpg" />

Let's say you've setup an [Azure Data Explorer](/2020/02/19/azure-data-explorer-kusto) cluster.  You've also setup real time ingestion pipeline.  If you haven't, take a look at the [Real Time Lab I've put together](https://github.com/vplauzon/real-time-lab), where you're going to build pipelines and query data in real time.

Now this has been running for weeks, maybe months.

You need to do a change.  Maybe you need to add a column to a table.  Maybe you need to rename or change the type of a column.

How do you do that while keeping the ingestion going without dropping records?

This is what we are going to explore in this article.

As usual, [code is in GitHub](https://github.com/vplauzon/kusto/tree/master/change-management).  All scripts in this article are put together in [one script here](https://github.com/vplauzon/kusto/tree/master/change-management/sample.kql).

## Setup of a demo solution

Here we're going to setup a simple solution in a database.  In order to run the scripts, we recommend to create a separate database and run them in the context of that database.  This way, it is easy to delete the database altogether to cleanup.

First, let's create a landing table.  We suppose that table has data ingested into it in new real time, i.e. new data shows up every minute or less.

```sql
.create table invoices(EMPLOYEE_NAME:string, AMOUNT:long, DEPARTMENT_ID:int)
```

We'll then create and populate a lookup table:

```sql
.set-or-append departments <|
    datatable(id:int, department:string)
    [
        1, "Corp",
        2, "HR",
        3, "Engineering",
        4, "Sales",
        5, "Finance",
        6, "Operation"
    ]
```

Let's define a function for an update policy:

```sql
.create-or-alter function transformInvoices(){
    invoices
    | join kind=inner departments on $left.DEPARTMENT_ID==$right.id
    | project EMPLOYEE_NAME, AMOUNT, department
}
```

Using the function return schema, we can easily define the target table where the transformed data will land:

```sql
.set-or-append prettyInvoices <| transformInvoices()
    | limit 0
```

//  Let's create an update policy to transform the data from invoices to transformedInvoices
.alter table prettyInvoices policy update
@'[{"IsEnabled": true, "Source": "invoices", "Query": "transformInvoices", "IsTransactional": true, "PropagateIngestionProperties": true}]'

//  Let's insert some data to see all this mechanic working
.set-or-append invoices <|
    datatable(EMPLOYEE_NAME:string, AMOUNT:long, DEPARTMENT_ID:int)
    [
        "Bob", 5, 2,
        "Carol", 20, 2,
        "Alice", 10, 3
    ]

//  We can validate the data landed in invoices:
invoices

//  We validate the update policy transformed the data:
prettyInvoices

//  We have our baseline ready
//  Let's explore different change management scenarios
