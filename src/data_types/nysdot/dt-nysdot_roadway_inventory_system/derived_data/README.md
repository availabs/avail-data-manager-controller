# NYSDOT Roadway Inventory System Derived Data

## Total roadway miles by jurisdiction

```sql
SELECT
    jurisdiction,
    ROUND(SUM(section_length)::NUMERIC, 1) AS total_miles,
    ROUND(SUM(section_length * COALESCE(total_lanes, 2))::NUMERIC, 1) AS total_lane_miles
  FROM nysdot_roadway_inventory_system.roadway_inventory_system
  GROUP BY 1
  ORDER BY 3 DESC
;
          jurisdiction           | total_miles | total_lane_miles 
---------------------------------+-------------+------------------
 03 Town                         |     58087.2 |         114833.5
 02 County                       |     20202.7 |          41668.0
 01 NYSDOT                       |     17984.5 |          40414.1
 04 City or village              |     18166.5 |          36015.1
 31 NYS Thruway                  |      1415.7 |           2817.0
 90 Public - Unclaimed           |       535.5 |            979.7
 21 Other State agencies         |       495.0 |            884.9
 74 Army                         |       481.4 |            721.4
 11 State Parks                  |       347.3 |            697.5
 26 Private or Restricted Access |       377.0 |            667.8
 25 Other local agencies         |       133.8 |            283.0
 12 Local Parks                  |       139.1 |            256.4
 32 Other Toll Authority         |        78.4 |            202.4
 62 Bureau of Indian Affairs     |        97.9 |            184.0
 40 Other Public Instrumentality |        88.6 |            169.7
 50 Indian Tribal Government     |        79.1 |            154.8
 41 Local Service                |        71.9 |            136.5
 91 Public Restricted            |        47.5 |             89.6
 92 Slip Lane                    |        69.3 |             72.8
 66 National Park Service        |        42.1 |             71.6
 60 Other Federal agencies       |        36.9 |             71.5
 73 Navy/Marines                 |        11.0 |             21.2
 80 Other                        |         8.0 |             17.9
 95 Non-Mainline - Connector     |        10.5 |             16.8
 70 Corps of Engineers (Civil)   |         6.6 |              9.0
 63 Bureau of Fish and Wildlife  |         6.4 |              7.7
 93 Roundabout                   |         5.4 |              6.9
 64 U.S. Forest Service          |         0.6 |              0.9
 27 Railroad                     |         0.4 |              0.7
 72 Air Force                    |         0.2 |              0.2
 94 Non-Mainline - Other         |         0.2 |              0.2
(31 rows)
```

* [sql](./miles_by_jurisdiction.sql)
* [csv](./miles_by_jurisdiction.csv)

## Total roadway miles by owning_jurisdiction

```sql
SELECT
    owning_jurisdiction,
    ROUND(SUM(section_length)::NUMERIC, 1) AS total_miles,
    ROUND(SUM(section_length * COALESCE(total_lanes, 2))::NUMERIC, 1) AS total_lane_miles
  FROM nysdot_roadway_inventory_system.roadway_inventory_system
  GROUP BY 1
  ORDER BY 3 DESC
;
       owning_jurisdiction       | total_miles | total_lane_miles 
---------------------------------+-------------+------------------
 03 Town                         |     58124.6 |         114898.6
 02 County                       |     20245.5 |          41728.7
 01 NYSDOT                       |     17925.7 |          40195.3
 04 City or village              |     18192.0 |          35990.8
 31 NYS Thruway                  |      1404.5 |           2784.0
 11 State Parks                  |       468.5 |           1076.7
 90 Public - Unclaimed           |       535.3 |            979.0
 21 Other State agencies         |       513.5 |            920.1
 74 Army                         |       481.4 |            721.4
 26 Private or Restricted Access |       377.7 |            669.2
 25 Other local agencies         |       134.7 |            284.7
 12 Local Parks                  |       148.1 |            275.7
 32 Other Toll Authority         |        78.6 |            202.8
 62 Bureau of Indian Affairs     |       105.2 |            198.8
 40 Other Public Instrumentality |        89.3 |            170.9
 50 Indian Tribal Government     |        79.1 |            154.8
 66 National Park Service        |        42.6 |             72.6
 60 Other Federal agencies       |        37.4 |             72.5
 73 Navy/Marines                 |        11.0 |             21.2
 80 Other                        |         8.0 |             17.9
 41 Local Service                |         6.4 |             12.4
 70 Corps of Engineers (Civil)   |         6.6 |              9.0
 63 Bureau of Fish and Wildlife  |         6.4 |              7.7
 91 Public Restricted            |         3.1 |              6.1
 64 U.S. Forest Service          |         0.6 |              0.9
 27 Railroad                     |         0.4 |              0.7
 72 Air Force                    |         0.2 |              0.2
 93 Roundabout                   |         0.0 |              0.1
 95 Non-Mainline - Connector     |         0.1 |              0.1
(29 rows)
```

* [sql](./miles_by_owning_jurisdiction.sql)
* [csv](./miles_by_owning_jurisdiction.csv)


## Total roadway miles by owning_jurisdiction by county_name

```sql
COPY (
  SELECT
      county_name,
      owning_jurisdiction,
      ROUND(SUM(section_length)::NUMERIC, 1) AS total_miles,
      ROUND(SUM(section_length * COALESCE(total_lanes, 2))::NUMERIC, 1) AS total_lane_miles
    FROM nysdot_roadway_inventory_system.roadway_inventory_system
    GROUP BY 1,2
    ORDER BY 1,4 DESC
) TO STDOUT WITH CSV HEADER
;

county_name  owning_jurisdiction              total_miles  total_lane_miles
ALBANY       03 Town                          1035.0       1999.6
ALBANY       01 NYSDOT                        387.0        907.0
ALBANY       04 City or village               397.9        779.8
ALBANY       02 County                        287.8        585.4
ALBANY       31 NYS Thruway                   70.3         143.8
ALBANY       21 Other State agencies          26.2         54.4
ALBANY       90 Public - Unclaimed            28.0         53.3
ALBANY       26 Private or Restricted Access  9.0          16.9
ALBANY       12 Local Parks                   5.3          10.2
ALBANY       11 State Parks                   5.0          10.1
ALBANY       40 Other Public Instrumentality  4.4          8.6
ALBANY       74 Army                          4.1          7.9
ALBANY       25 Other local agencies          3.7          6.7
ALBANY       91 Public Restricted             0.6          1.3
ALBANY       27 Railroad                      0.3          0.7
ALBANY       41 Local Service                 0.1          0.2
ALLEGANY     03 Town                          1215.4       2407.7
ALLEGANY     02 County                        341.4        682.8
ALLEGANY     01 NYSDOT                        272.2        545.2
ALLEGANY     04 City or village               72.9         145.2
ALLEGANY     21 Other State agencies          6.3          11.7
ALLEGANY     26 Private or Restricted Access  5.7          9.3
ALLEGANY     50 Indian Tribal Government      0.3          0.6
ALLEGANY     11 State Parks                   0.4          0.4
BRONX        04 City or village               753.8        1507.8
BRONX        01 NYSDOT                        109.8        265.4
BRONX        31 NYS Thruway                   12.8         26.3
BRONX        32 Other Toll Authority          7.4          22.7
BRONX        26 Private or Restricted Access  10.0         12.1
BRONX        21 Other State agencies          2.3          2.7
BRONX        12 Local Parks                   0.8          1.5
BRONX        90 Public - Unclaimed            0.3          0.3
BROOME       03 Town                          1059.6       2119.6
BROOME       01 NYSDOT                        445.5        952.0
BROOME       02 County                        340.9        686.6
BROOME       04 City or village               267.8        537.6
BROOME       21 Other State agencies          9.4          18.4
BROOME       11 State Parks                   6.1          12.2
BROOME       26 Private or Restricted Access  5.5          11.0
BROOME       70 Corps of Engineers (Civil)    4.5          5.3
BROOME       12 Local Parks                   0.3          0.7
CATTARAUGUS  03 Town                          1208.4       2372.4
CATTARAUGUS  01 NYSDOT                        395.0        806.8
CATTARAUGUS  02 County                        392.3        785.2
CATTARAUGUS  04 City or village               152.3        304.3
CATTARAUGUS  11 State Parks                   83.5         162.0
CATTARAUGUS  62 Bureau of Indian Affairs      36.8         70.1
CATTARAUGUS  50 Indian Tribal Government      18.2         36.4
CATTARAUGUS  26 Private or Restricted Access  4.6          8.7
CATTARAUGUS  21 Other State agencies          4.2          8.1
CAYUGA       03 Town                          697.1        1350.3
CAYUGA       02 County                        508.7        1016.8
CAYUGA       01 NYSDOT                        276.3        569.5
CAYUGA       04 City or village               133.1        270.3
CAYUGA       31 NYS Thruway                   28.9         54.5
CAYUGA       26 Private or Restricted Access  2.4          4.0
CAYUGA       12 Local Parks                   0.7          1.5
CAYUGA       11 State Parks                   0.6          1.1
CAYUGA       21 Other State agencies          0.2          0.3
CHAUTAUQUA   03 Town                          1199.9       2377.0
CHAUTAUQUA   02 County                        550.6        1105.9
CHAUTAUQUA   01 NYSDOT                        409.1        828.6
CHAUTAUQUA   04 City or village               307.5        613.6
CHAUTAUQUA   31 NYS Thruway                   97.0         181.7
CHAUTAUQUA   21 Other State agencies          11.5         20.9
CHAUTAUQUA   26 Private or Restricted Access  10.3         20.1
CHAUTAUQUA   90 Public - Unclaimed            9.6          17.6
CHAUTAUQUA   11 State Parks                   4.8          9.2
CHAUTAUQUA   40 Other Public Instrumentality  4.7          7.8
CHAUTAUQUA   62 Bureau of Indian Affairs      2.1          3.9
CHAUTAUQUA   91 Public Restricted             0.9          1.7
CHAUTAUQUA   60 Other Federal agencies        0.5          1.0
CHAUTAUQUA   12 Local Parks                   0.1          0.3
CHAUTAUQUA   74 Army                          0.1          0.2
CHEMUNG      03 Town                          566.0        1127.7
CHEMUNG      02 County                        245.2        495.6
CHEMUNG      01 NYSDOT                        170.4        353.3
CHEMUNG      04 City or village               175.3        349.8
CHEMUNG      21 Other State agencies          4.3          7.2
CHEMUNG      26 Private or Restricted Access  1.9          3.0
CHEMUNG      90 Public - Unclaimed            0.5          1.0
CHENANGO     03 Town                          1092.2       2138.7
CHENANGO     02 County                        307.2        615.9
CHENANGO     01 NYSDOT                        278.7        558.7
CHENANGO     04 City or village               63.2         124.1
CHENANGO     11 State Parks                   4.9          9.8
CHENANGO     26 Private or Restricted Access  3.7          6.8
CHENANGO     21 Other State agencies          3.0          5.1
CHENANGO     95 Non-Mainline - Connector      0.0          0.0
CLINTON      03 Town                          801.3        1606.5
CLINTON      02 County                        345.6        692.2
CLINTON      01 NYSDOT                        338.2        668.3
CLINTON      04 City or village               81.7         166.1
CLINTON      26 Private or Restricted Access  9.7          19.0
CLINTON      21 Other State agencies          4.2          6.6
CLINTON      11 State Parks                   1.2          2.3
CLINTON      25 Other local agencies          0.9          1.8
CLINTON      12 Local Parks                   0.7          1.4
CLINTON      90 Public - Unclaimed            0.2          0.3
CLINTON      74 Army                          0.0          0.1
COLUMBIA     03 Town                          884.3        1744.9
COLUMBIA     01 NYSDOT                        272.1        613.5
COLUMBIA     02 County                        263.3        526.6
COLUMBIA     04 City or village               50.6         105.7
COLUMBIA     31 NYS Thruway                   35.2         65.8
COLUMBIA     26 Private or Restricted Access  8.2          14.3
COLUMBIA     21 Other State agencies          3.8          6.5
COLUMBIA     32 Other Toll Authority          0.5          1.0
COLUMBIA     66 National Park Service         0.5          0.5
COLUMBIA     11 State Parks                   0.2          0.2
COLUMBIA     90 Public - Unclaimed            0.1          0.2
CORTLAND     03 Town                          497.6        957.9
CORTLAND     02 County                        247.0        494.1
CORTLAND     01 NYSDOT                        237.0        477.9
CORTLAND     04 City or village               68.9         140.5
CORTLAND     21 Other State agencies          3.7          7.4
CORTLAND     26 Private or Restricted Access  1.2          1.8
DELAWARE     03 Town                          1509.3       2955.8
DELAWARE     01 NYSDOT                        370.3        804.5
DELAWARE     02 County                        256.2        513.8
DELAWARE     04 City or village               80.4         155.6
DELAWARE     25 Other local agencies          36.3         71.8
DELAWARE     21 Other State agencies          3.1          5.7
DELAWARE     26 Private or Restricted Access  2.5          4.3
DELAWARE     70 Corps of Engineers (Civil)    1.1          1.8
DUTCHESS     03 Town                          1466.0       2907.8
DUTCHESS     01 NYSDOT                        415.6        987.2
DUTCHESS     02 County                        392.5        787.6
DUTCHESS     04 City or village               181.4        358.9
DUTCHESS     21 Other State agencies          21.5         37.1
DUTCHESS     26 Private or Restricted Access  11.2         22.6
DUTCHESS     11 State Parks                   4.9          9.7
DUTCHESS     32 Other Toll Authority          4.0          9.7
DUTCHESS     66 National Park Service         4.5          7.3
DUTCHESS     25 Other local agencies          0.4          0.9
DUTCHESS     12 Local Parks                   0.3          0.6
DUTCHESS     90 Public - Unclaimed            0.1          0.3
DUTCHESS     74 Army                          0.1          0.1
ERIE         03 Town                          1806.5       3619.5
ERIE         02 County                        1180.6       2458.2
ERIE         04 City or village               999.5        1960.2
ERIE         01 NYSDOT                        609.4        1677.4
ERIE         31 NYS Thruway                   198.0        395.8
ERIE         90 Public - Unclaimed            39.1         71.9
ERIE         21 Other State agencies          36.7         69.9
ERIE         12 Local Parks                   34.4         67.5
ERIE         62 Bureau of Indian Affairs      31.7         62.9
ERIE         11 State Parks                   22.0         55.0
ERIE         26 Private or Restricted Access  8.8          17.3
ERIE         40 Other Public Instrumentality  8.2          15.7
ERIE         32 Other Toll Authority          4.1          5.7
ERIE         50 Indian Tribal Government      2.6          5.2
ERIE         25 Other local agencies          1.7          3.3
ERIE         74 Army                          0.3          0.5
ESSEX        03 Town                          628.6        1251.8
ESSEX        01 NYSDOT                        398.1        796.2
ESSEX        02 County                        356.8        713.8
ESSEX        21 Other State agencies          25.4         49.2
ESSEX        04 City or village               20.0         39.3
ESSEX        90 Public - Unclaimed            9.2          16.9
ESSEX        26 Private or Restricted Access  7.0          12.8
ESSEX        91 Public Restricted             0.3          0.6
ESSEX        40 Other Public Instrumentality  0.2          0.4
ESSEX        25 Other local agencies          0.1          0.1
FRANKLIN     03 Town                          763.8        1523.8
FRANKLIN     01 NYSDOT                        266.0        538.6
FRANKLIN     02 County                        266.2        532.4
FRANKLIN     04 City or village               62.9         125.6
FRANKLIN     62 Bureau of Indian Affairs      34.6         61.9
FRANKLIN     21 Other State agencies          10.0         19.8
FRANKLIN     26 Private or Restricted Access  2.2          2.6
FRANKLIN     11 State Parks                   0.2          0.2
FRANKLIN     74 Army                          0.1          0.2
FRANKLIN     90 Public - Unclaimed            0.1          0.1
FULTON       03 Town                          435.9        841.3
FULTON       02 County                        143.3        286.6
FULTON       01 NYSDOT                        142.8        285.9
FULTON       04 City or village               127.8        260.7
FULTON       26 Private or Restricted Access  1.5          2.2
FULTON       21 Other State agencies          0.5          0.8
GENESEE      03 Town                          460.0        917.9
GENESEE      02 County                        261.1        522.8
GENESEE      01 NYSDOT                        197.5        417.1
GENESEE      04 City or village               77.2         155.9
GENESEE      31 NYS Thruway                   71.1         131.3
GENESEE      50 Indian Tribal Government      16.3         32.4
GENESEE      21 Other State agencies          1.5          3.0
GENESEE      26 Private or Restricted Access  0.4          0.6
GENESEE      63 Bureau of Fish and Wildlife   0.1          0.1
GREENE       03 Town                          641.2        1229.6
GREENE       02 County                        261.4        522.9
GREENE       01 NYSDOT                        196.7        420.1
GREENE       31 NYS Thruway                   55.2         104.5
GREENE       04 City or village               50.1         95.4
GREENE       21 Other State agencies          11.3         21.2
GREENE       90 Public - Unclaimed            10.6         19.8
GREENE       40 Other Public Instrumentality  1.7          3.4
GREENE       12 Local Parks                   0.8          1.6
GREENE       26 Private or Restricted Access  0.4          0.8
GREENE       32 Other Toll Authority          0.4          0.8
GREENE       41 Local Service                 0.2          0.5
GREENE       91 Public Restricted             0.0          0.0
HAMILTON     01 NYSDOT                        178.7        359.5
HAMILTON     03 Town                          171.7        335.0
HAMILTON     02 County                        93.5         186.9
HAMILTON     04 City or village               9.8          19.4
HAMILTON     21 Other State agencies          12.9         13.1
HAMILTON     26 Private or Restricted Access  1.5          2.9
HAMILTON     91 Public Restricted             0.0          0.1
HERKIMER     02 County                        574.5        1146.7
HERKIMER     03 Town                          555.2        1027.2
HERKIMER     01 NYSDOT                        246.2        527.5
HERKIMER     04 City or village               116.3        232.2
HERKIMER     31 NYS Thruway                   56.6         106.0
HERKIMER     26 Private or Restricted Access  3.6          7.1
HERKIMER     21 Other State agencies          3.9          7.0
JEFFERSON    03 Town                          1015.0       2011.8
JEFFERSON    02 County                        541.0        1086.1
JEFFERSON    01 NYSDOT                        502.2        998.1
JEFFERSON    74 Army                          314.1        460.9
JEFFERSON    04 City or village               192.5        386.8
JEFFERSON    11 State Parks                   20.1         36.9
JEFFERSON    90 Public - Unclaimed            12.3         20.5
JEFFERSON    21 Other State agencies          8.5          16.0
JEFFERSON    26 Private or Restricted Access  3.5          6.4
JEFFERSON    32 Other Toll Authority          1.8          2.9
JEFFERSON    40 Other Public Instrumentality  0.8          1.8
JEFFERSON    12 Local Parks                   0.3          0.5
JEFFERSON    25 Other local agencies          0.2          0.4
JEFFERSON    60 Other Federal agencies        0.2          0.2
KINGS        04 City or village               1486.5       2634.6
KINGS        01 NYSDOT                        53.4         127.0
KINGS        26 Private or Restricted Access  17.7         27.4
KINGS        32 Other Toll Authority          8.1          22.3
KINGS        66 National Park Service         5.6          11.4
KINGS        12 Local Parks                   5.4          9.4
KINGS        74 Army                          3.8          7.3
KINGS        21 Other State agencies          1.7          3.4
KINGS        90 Public - Unclaimed            0.2          0.4
LEWIS        03 Town                          878.4        1737.6
LEWIS        02 County                        248.3        496.5
LEWIS        01 NYSDOT                        154.2        313.9
LEWIS        04 City or village               26.9         53.7
LEWIS        74 Army                          33.9         33.9
LEWIS        21 Other State agencies          6.7          11.9
LEWIS        26 Private or Restricted Access  1.6          2.6
LEWIS        11 State Parks                   1.0          2.0
LIVINGSTON   03 Town                          746.0        1467.8
LIVINGSTON   01 NYSDOT                        315.7        627.8
LIVINGSTON   02 County                        242.5        485.0
LIVINGSTON   04 City or village               87.3         174.8
LIVINGSTON   21 Other State agencies          15.6         24.1
LIVINGSTON   25 Other local agencies          2.8          5.1
LIVINGSTON   11 State Parks                   1.7          3.4
LIVINGSTON   26 Private or Restricted Access  0.6          0.6
LIVINGSTON   90 Public - Unclaimed            0.2          0.5
MADISON      03 Town                          717.1        1404.0
MADISON      02 County                        434.9        869.6
MADISON      01 NYSDOT                        170.3        367.8
MADISON      04 City or village               114.0        231.6
MADISON      31 NYS Thruway                   37.0         70.8
MADISON      26 Private or Restricted Access  2.1          3.3
MADISON      21 Other State agencies          1.7          3.2
MADISON      25 Other local agencies          0.0          0.1
MONROE       03 Town                          1705.0       3410.1
MONROE       01 NYSDOT                        640.3        1530.2
MONROE       02 County                        667.1        1446.6
MONROE       04 City or village               649.5        1386.3
MONROE       11 State Parks                   38.7         112.9
MONROE       31 NYS Thruway                   49.0         93.1
MONROE       90 Public - Unclaimed            34.2         68.3
MONROE       12 Local Parks                   22.5         42.2
MONROE       21 Other State agencies          16.2         28.8
MONROE       40 Other Public Instrumentality  11.0         21.9
MONROE       26 Private or Restricted Access  11.0         21.3
MONROE       25 Other local agencies          1.7          2.7
MONROE       74 Army                          0.7          1.3
MONTGOMERY   02 County                        391.0        783.1
MONTGOMERY   03 Town                          291.1        544.7
MONTGOMERY   01 NYSDOT                        181.3        390.2
MONTGOMERY   04 City or village               126.6        250.6
MONTGOMERY   31 NYS Thruway                   89.0         167.7
MONTGOMERY   90 Public - Unclaimed            5.7          11.0
MONTGOMERY   21 Other State agencies          4.5          6.3
MONTGOMERY   40 Other Public Instrumentality  2.0          4.0
MONTGOMERY   26 Private or Restricted Access  0.8          1.2
MONTGOMERY   41 Local Service                 0.1          0.2
NASSAU       03 Town                          2179.2       4442.2
NASSAU       04 City or village               1258.2       2553.3
NASSAU       02 County                        483.8        1464.1
NASSAU       01 NYSDOT                        357.0        1203.7
NASSAU       90 Public - Unclaimed            68.6         133.4
NASSAU       26 Private or Restricted Access  12.8         25.0
NASSAU       12 Local Parks                   11.2         23.1
NASSAU       11 State Parks                   7.2          22.3
NASSAU       21 Other State agencies          7.8          14.1
NASSAU       40 Other Public Instrumentality  6.9          11.3
NASSAU       25 Other local agencies          2.6          5.3
NASSAU       32 Other Toll Authority          0.5          2.9
NASSAU       41 Local Service                 0.5          1.0
NASSAU       60 Other Federal agencies        0.5          0.9
NASSAU       66 National Park Service         0.5          0.5
NASSAU       74 Army                          0.1          0.1
NASSAU       95 Non-Mainline - Connector      0.1          0.1
NEW YORK     04 City or village               482.4        1081.2
NEW YORK     01 NYSDOT                        46.7         178.3
NEW YORK     32 Other Toll Authority          21.7         59.3
NEW YORK     12 Local Parks                   9.3          14.8
NEW YORK     25 Other local agencies          6.3          12.4
NEW YORK     26 Private or Restricted Access  3.2          5.0
NEW YORK     90 Public - Unclaimed            1.7          3.0
NEW YORK     21 Other State agencies          0.7          1.0
NEW YORK     66 National Park Service         0.2          0.3
NIAGARA      03 Town                          626.7        1248.7
NIAGARA      04 City or village               447.6        863.5
NIAGARA      01 NYSDOT                        264.7        619.9
NIAGARA      02 County                        284.7        572.9
NIAGARA      11 State Parks                   47.2         110.8
NIAGARA      50 Indian Tribal Government      18.7         36.4
NIAGARA      90 Public - Unclaimed            10.5         18.7
NIAGARA      74 Army                          9.0          18.0
NIAGARA      32 Other Toll Authority          6.1          10.5
NIAGARA      31 NYS Thruway                   2.2          3.5
NIAGARA      26 Private or Restricted Access  1.1          2.2
NIAGARA      40 Other Public Instrumentality  1.0          2.0
NIAGARA      21 Other State agencies          0.9          1.9
NIAGARA      12 Local Parks                   0.8          1.3
NIAGARA      91 Public Restricted             0.0          0.0
ONEIDA       03 Town                          1271.8       2473.6
ONEIDA       02 County                        593.7        1191.9
ONEIDA       01 NYSDOT                        468.1        1125.9
ONEIDA       04 City or village               508.7        1032.2
ONEIDA       31 NYS Thruway                   65.5         118.0
ONEIDA       90 Public - Unclaimed            37.3         59.9
ONEIDA       21 Other State agencies          28.4         49.9
ONEIDA       40 Other Public Instrumentality  10.7         20.9
ONEIDA       26 Private or Restricted Access  10.7         18.7
ONEIDA       11 State Parks                   3.9          7.7
ONEIDA       12 Local Parks                   4.0          6.2
ONEIDA       80 Other                         2.0          5.9
ONEIDA       25 Other local agencies          0.9          1.4
ONEIDA       66 National Park Service         0.5          1.0
ONEIDA       72 Air Force                     0.2          0.2
ONEIDA       74 Army                          0.1          0.1
ONONDAGA     03 Town                          1332.9       2674.3
ONONDAGA     02 County                        793.7        1662.4
ONONDAGA     04 City or village               572.7        1314.6
ONONDAGA     01 NYSDOT                        558.9        1260.8
ONONDAGA     31 NYS Thruway                   79.9         136.2
ONONDAGA     90 Public - Unclaimed            38.1         76.3
ONONDAGA     50 Indian Tribal Government      14.7         27.6
ONONDAGA     21 Other State agencies          12.9         25.5
ONONDAGA     12 Local Parks                   11.3         20.2
ONONDAGA     11 State Parks                   7.8          15.5
ONONDAGA     26 Private or Restricted Access  6.5          12.5
ONONDAGA     25 Other local agencies          3.2          6.4
ONONDAGA     41 Local Service                 3.1          6.2
ONONDAGA     40 Other Public Instrumentality  3.1          6.0
ONONDAGA     80 Other                         0.3          0.5
ONONDAGA     74 Army                          0.1          0.3
ONONDAGA     60 Other Federal agencies        0.1          0.2
ONONDAGA     91 Public Restricted             0.1          0.1
ONTARIO      03 Town                          934.7        1866.0
ONTARIO      01 NYSDOT                        225.7        492.0
ONTARIO      02 County                        239.5        479.0
ONTARIO      04 City or village               129.0        257.3
ONTARIO      31 NYS Thruway                   68.9         133.3
ONTARIO      26 Private or Restricted Access  3.3          6.6
ONTARIO      21 Other State agencies          2.0          3.7
ONTARIO      11 State Parks                   1.0          2.0
ONTARIO      90 Public - Unclaimed            0.3          0.5
ONTARIO      74 Army                          0.2          0.3
ORANGE       03 Town                          1348.6       2696.9
ORANGE       01 NYSDOT                        486.1        1081.2
ORANGE       04 City or village               450.1        959.0
ORANGE       02 County                        301.8        606.6
ORANGE       74 Army                          111.3        183.1
ORANGE       31 NYS Thruway                   73.5         158.1
ORANGE       11 State Parks                   47.1         102.8
ORANGE       21 Other State agencies          17.6         31.6
ORANGE       26 Private or Restricted Access  14.5         24.9
ORANGE       25 Other local agencies          3.3          10.8
ORANGE       80 Other                         5.2          10.4
ORANGE       32 Other Toll Authority          1.7          5.0
ORANGE       12 Local Parks                   0.6          1.2
ORLEANS      03 Town                          381.5        758.7
ORLEANS      02 County                        196.8        393.6
ORLEANS      01 NYSDOT                        158.4        316.2
ORLEANS      04 City or village               54.7         107.2
ORLEANS      11 State Parks                   17.1         56.2
ORLEANS      26 Private or Restricted Access  1.5          2.9
ORLEANS      21 Other State agencies          1.1          2.1
ORLEANS      25 Other local agencies          0.1          0.1
OSWEGO       03 Town                          965.5        1918.4
OSWEGO       02 County                        505.3        1011.0
OSWEGO       01 NYSDOT                        327.6        691.6
OSWEGO       04 City or village               180.0        363.7
OSWEGO       90 Public - Unclaimed            44.7         62.1
OSWEGO       21 Other State agencies          26.0         35.7
OSWEGO       11 State Parks                   4.9          9.3
OSWEGO       40 Other Public Instrumentality  3.9          7.7
OSWEGO       26 Private or Restricted Access  1.9          3.6
OSWEGO       12 Local Parks                   0.7          1.4
OSWEGO       91 Public Restricted             0.4          0.9
OSWEGO       74 Army                          0.1          0.3
OTSEGO       03 Town                          1228.5       2411.0
OTSEGO       02 County                        476.4        952.7
OTSEGO       01 NYSDOT                        338.7        690.7
OTSEGO       04 City or village               82.8         162.5
OTSEGO       11 State Parks                   5.6          11.2
OTSEGO       21 Other State agencies          3.9          7.0
OTSEGO       26 Private or Restricted Access  2.1          4.0
PUTNAM       03 Town                          572.9        1136.6
PUTNAM       01 NYSDOT                        163.2        360.1
PUTNAM       02 County                        116.9        234.1
PUTNAM       04 City or village               12.7         24.6
PUTNAM       90 Public - Unclaimed            10.2         18.7
PUTNAM       26 Private or Restricted Access  6.1          12.2
PUTNAM       11 State Parks                   2.3          4.3
PUTNAM       40 Other Public Instrumentality  1.4          2.8
PUTNAM       12 Local Parks                   0.9          1.8
PUTNAM       25 Other local agencies          0.3          0.6
PUTNAM       21 Other State agencies          0.3          0.3
PUTNAM       41 Local Service                 0.1          0.1
QUEENS       04 City or village               2143.9       3950.1
QUEENS       01 NYSDOT                        207.1        460.9
QUEENS       25 Other local agencies          31.2         75.2
QUEENS       32 Other Toll Authority          10.0         28.0
QUEENS       26 Private or Restricted Access  18.3         24.4
QUEENS       12 Local Parks                   15.1         23.6
QUEENS       66 National Park Service         8.8          16.2
QUEENS       21 Other State agencies          4.5          8.2
QUEENS       74 Army                          1.0          1.9
RENSSELAER   03 Town                          904.6        1665.1
RENSSELAER   02 County                        330.1        660.0
RENSSELAER   01 NYSDOT                        293.2        635.0
RENSSELAER   04 City or village               215.8        405.5
RENSSELAER   90 Public - Unclaimed            28.0         55.1
RENSSELAER   31 NYS Thruway                   19.5         37.3
RENSSELAER   11 State Parks                   13.6         26.9
RENSSELAER   26 Private or Restricted Access  11.3         17.3
RENSSELAER   21 Other State agencies          4.9          7.9
RENSSELAER   40 Other Public Instrumentality  2.6          5.1
RENSSELAER   12 Local Parks                   0.6          1.2
RENSSELAER   41 Local Service                 0.3          0.6
RENSSELAER   25 Other local agencies          0.3          0.6
RENSSELAER   91 Public Restricted             0.1          0.2
RENSSELAER   27 Railroad                      0.0          0.0
RICHMOND     04 City or village               820.6        1472.8
RICHMOND     01 NYSDOT                        65.5         140.5
RICHMOND     26 Private or Restricted Access  15.7         30.4
RICHMOND     32 Other Toll Authority          8.2          20.0
RICHMOND     66 National Park Service         9.4          19.4
RICHMOND     21 Other State agencies          7.1          12.3
RICHMOND     25 Other local agencies          1.5          5.6
RICHMOND     74 Army                          0.4          0.9
ROCKLAND     03 Town                          600.1        1200.9
ROCKLAND     04 City or village               297.2        589.3
ROCKLAND     02 County                        176.1        358.4
ROCKLAND     01 NYSDOT                        113.9        276.8
ROCKLAND     11 State Parks                   70.2         186.8
ROCKLAND     31 NYS Thruway                   65.3         162.4
ROCKLAND     90 Public - Unclaimed            21.0         36.5
ROCKLAND     21 Other State agencies          8.6          16.7
ROCKLAND     26 Private or Restricted Access  3.6          7.0
ROCKLAND     40 Other Public Instrumentality  3.1          5.5
ROCKLAND     74 Army                          0.6          1.3
ROCKLAND     12 Local Parks                   0.8          1.0
ROCKLAND     91 Public Restricted             0.3          0.6
ROCKLAND     32 Other Toll Authority          0.3          0.5
ROCKLAND     41 Local Service                 0.2          0.4
ROCKLAND     93 Roundabout                    0.0          0.1
SARATOGA     03 Town                          1335.5       2646.1
SARATOGA     01 NYSDOT                        330.1        762.3
SARATOGA     02 County                        365.6        737.8
SARATOGA     04 City or village               236.3        458.7
SARATOGA     90 Public - Unclaimed            22.0         43.6
SARATOGA     11 State Parks                   12.1         21.3
SARATOGA     73 Navy/Marines                  11.0         21.2
SARATOGA     21 Other State agencies          7.1          14.0
SARATOGA     66 National Park Service         10.8         13.9
SARATOGA     26 Private or Restricted Access  5.0          9.7
SARATOGA     12 Local Parks                   2.9          5.7
SARATOGA     40 Other Public Instrumentality  1.9          3.9
SCHENECTADY  03 Town                          337.2        673.2
SCHENECTADY  02 County                        217.1        433.1
SCHENECTADY  01 NYSDOT                        188.0        427.4
SCHENECTADY  04 City or village               198.9        421.2
SCHENECTADY  31 NYS Thruway                   34.3         71.8
SCHENECTADY  90 Public - Unclaimed            12.4         24.8
SCHENECTADY  40 Other Public Instrumentality  5.5          10.3
SCHENECTADY  26 Private or Restricted Access  1.8          3.6
SCHENECTADY  25 Other local agencies          1.5          3.0
SCHENECTADY  21 Other State agencies          1.4          2.8
SCHENECTADY  41 Local Service                 1.2          2.4
SCHENECTADY  74 Army                          0.1          0.2
SCHOHARIE    03 Town                          620.7        1202.7
SCHOHARIE    02 County                        319.1        638.3
SCHOHARIE    01 NYSDOT                        213.9        465.8
SCHOHARIE    04 City or village               33.9         66.1
SCHOHARIE    21 Other State agencies          3.3          5.9
SCHOHARIE    26 Private or Restricted Access  2.6          4.5
SCHOHARIE    11 State Parks                   1.2          2.4
SCHOHARIE    41 Local Service                 0.2          0.4
SCHUYLER     03 Town                          444.3        877.7
SCHUYLER     02 County                        121.0        241.9
SCHUYLER     01 NYSDOT                        104.0        217.6
SCHUYLER     04 City or village               34.5         69.0
SCHUYLER     26 Private or Restricted Access  3.0          5.9
SCHUYLER     11 State Parks                   0.7          1.5
SCHUYLER     64 U.S. Forest Service           0.6          0.9
SCHUYLER     21 Other State agencies          0.2          0.4
SENECA       03 Town                          373.7        730.3
SENECA       01 NYSDOT                        158.2        325.5
SENECA       02 County                        156.2        312.4
SENECA       31 NYS Thruway                   29.6         72.2
SENECA       04 City or village               23.0         45.3
SENECA       21 Other State agencies          6.3          10.8
SENECA       63 Bureau of Fish and Wildlife   4.1          4.5
SENECA       26 Private or Restricted Access  0.3          0.6
SENECA       11 State Parks                   0.4          0.6
SENECA       64 U.S. Forest Service           0.0          0.0
STEUBEN      03 Town                          1876.4       3716.8
STEUBEN      02 County                        679.8        1359.6
STEUBEN      01 NYSDOT                        489.1        981.9
STEUBEN      04 City or village               197.9        389.4
STEUBEN      12 Local Parks                   1.1          2.2
STEUBEN      70 Corps of Engineers (Civil)    1.0          2.0
STEUBEN      26 Private or Restricted Access  0.9          1.5
STEUBEN      21 Other State agencies          0.2          0.2
ST LAWRENCE  03 Town                          1818.9       3608.0
ST LAWRENCE  02 County                        572.7        1145.5
ST LAWRENCE  01 NYSDOT                        516.1        1064.7
ST LAWRENCE  04 City or village               175.3        349.0
ST LAWRENCE  21 Other State agencies          19.2         37.2
ST LAWRENCE  26 Private or Restricted Access  4.4          8.3
ST LAWRENCE  32 Other Toll Authority          2.0          6.4
ST LAWRENCE  12 Local Parks                   1.1          2.2
ST LAWRENCE  63 Bureau of Fish and Wildlife   0.5          1.0
ST LAWRENCE  74 Army                          0.1          0.2
ST LAWRENCE  90 Public - Unclaimed            0.1          0.2
SUFFOLK      03 Town                          5755.7       11503.3
SUFFOLK      01 NYSDOT                        702.6        1918.7
SUFFOLK      04 City or village               647.5        1278.9
SUFFOLK      02 County                        428.8        1165.2
SUFFOLK      26 Private or Restricted Access  50.3         87.7
SUFFOLK      60 Other Federal agencies        36.1         70.2
SUFFOLK      21 Other State agencies          32.8         60.0
SUFFOLK      11 State Parks                   10.4         26.8
SUFFOLK      50 Indian Tribal Government      8.3          16.0
SUFFOLK      12 Local Parks                   2.1          4.0
SUFFOLK      90 Public - Unclaimed            2.0          2.4
SUFFOLK      63 Bureau of Fish and Wildlife   1.7          2.1
SUFFOLK      66 National Park Service         1.8          2.0
SUFFOLK      74 Army                          0.9          1.8
SUFFOLK      80 Other                         0.5          0.9
SUFFOLK      25 Other local agencies          0.3          0.6
SULLIVAN     03 Town                          1381.8       2716.9
SULLIVAN     02 County                        385.2        771.7
SULLIVAN     01 NYSDOT                        228.4        546.2
SULLIVAN     04 City or village               67.0         132.4
SULLIVAN     25 Other local agencies          6.0          11.9
SULLIVAN     26 Private or Restricted Access  2.8          5.5
SULLIVAN     21 Other State agencies          2.5          3.6
SULLIVAN     80 Other                         0.1          0.2
TIOGA        03 Town                          754.1        1484.4
TIOGA        01 NYSDOT                        222.6        381.2
TIOGA        02 County                        140.1        280.2
TIOGA        04 City or village               52.4         103.3
TIOGA        26 Private or Restricted Access  3.3          5.8
TIOGA        12 Local Parks                   1.1          2.0
TOMPKINS     03 Town                          615.2        1185.2
TOMPKINS     02 County                        300.6        602.3
TOMPKINS     01 NYSDOT                        167.2        351.6
TOMPKINS     04 City or village               138.4        276.5
TOMPKINS     26 Private or Restricted Access  8.6          16.7
TOMPKINS     21 Other State agencies          4.9          9.2
TOMPKINS     11 State Parks                   4.0          7.9
TOMPKINS     25 Other local agencies          0.5          0.9
TOMPKINS     74 Army                          0.1          0.3
ULSTER       03 Town                          1369.7       2712.3
ULSTER       02 County                        422.2        846.0
ULSTER       01 NYSDOT                        294.9        640.5
ULSTER       04 City or village               123.9        242.0
ULSTER       31 NYS Thruway                   87.1         165.7
ULSTER       25 Other local agencies          28.8         56.6
ULSTER       21 Other State agencies          8.9          16.7
ULSTER       26 Private or Restricted Access  7.2          12.6
ULSTER       32 Other Toll Authority          1.6          4.8
ULSTER       12 Local Parks                   0.5          1.0
ULSTER       74 Army                          0.1          0.2
ULSTER       63 Bureau of Fish and Wildlife   0.0          0.1
WARREN       03 Town                          683.9        1335.4
WARREN       01 NYSDOT                        273.9        576.2
WARREN       02 County                        244.3        496.9
WARREN       04 City or village               69.4         136.9
WARREN       90 Public - Unclaimed            7.5          14.6
WARREN       21 Other State agencies          7.3          13.9
WARREN       26 Private or Restricted Access  6.2          9.8
WARREN       40 Other Public Instrumentality  1.2          2.5
WARREN       12 Local Parks                   1.1          2.1
WARREN       11 State Parks                   0.4          0.8
WARREN       41 Local Service                 0.4          0.4
WARREN       25 Other local agencies          0.2          0.4
WASHINGTON   03 Town                          968.8        1868.5
WASHINGTON   02 County                        284.6        569.2
WASHINGTON   01 NYSDOT                        232.5        465.4
WASHINGTON   04 City or village               77.4         152.0
WASHINGTON   26 Private or Restricted Access  2.8          4.9
WASHINGTON   21 Other State agencies          3.0          4.4
WASHINGTON   90 Public - Unclaimed            2.0          3.5
WAYNE        03 Town                          856.0        1706.9
WAYNE        02 County                        402.7        806.6
WAYNE        01 NYSDOT                        174.5        376.7
WAYNE        04 City or village               99.3         197.9
WAYNE        21 Other State agencies          3.2          6.3
WAYNE        26 Private or Restricted Access  0.9          1.8
WESTCHESTER  03 Town                          1450.4       2894.6
WESTCHESTER  04 City or village               1344.1       2804.5
WESTCHESTER  01 NYSDOT                        612.5        1812.1
WESTCHESTER  02 County                        145.3        368.1
WESTCHESTER  31 NYS Thruway                   78.9         184.4
WESTCHESTER  90 Public - Unclaimed            78.6         143.5
WESTCHESTER  21 Other State agencies          20.0         36.2
WESTCHESTER  40 Other Public Instrumentality  15.1         29.4
WESTCHESTER  26 Private or Restricted Access  15.4         28.4
WESTCHESTER  12 Local Parks                   11.3         23.5
WESTCHESTER  11 State Parks                   4.2          8.0
WESTCHESTER  91 Public Restricted             0.3          0.5
WESTCHESTER  32 Other Toll Authority          0.2          0.4
WYOMING      03 Town                          609.3        1206.1
WYOMING      02 County                        240.9        481.8
WYOMING      01 NYSDOT                        205.1        414.8
WYOMING      04 City or village               49.0         97.7
WYOMING      11 State Parks                   7.2          14.5
WYOMING      21 Other State agencies          5.9          11.0
WYOMING      26 Private or Restricted Access  0.6          1.0
WYOMING      25 Other local agencies          0.1          0.2
YATES        03 Town                          478.8        950.2
YATES        02 County                        179.9        359.8
YATES        01 NYSDOT                        107.8        218.1
YATES        04 City or village               33.8         67.3
YATES        11 State Parks                   4.9          9.9
YATES        26 Private or Restricted Access  0.6          1.2
YATES        74 Army                          0.0          0.1
```

* [sql](./miles_by_owning_jurisdiction_by_county.sql)
* [csv](./miles_by_owning_jurisdiction_by_county.csv)
