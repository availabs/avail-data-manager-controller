CREATE TABLE IF NOT EXISTS nysdot_structures.government_agency_ownership_classifications (
  name              TEXT PRIMARY KEY,
  classification    TEXT NOT NULL
) ;

INSERT INTO nysdot_structures.government_agency_ownership_classifications (
  name,
  classification
)
  VALUES
    ( '50 - Federal (Other than those listed below)',                        'Federal' ),
    ( '50--50 - Federal (Other than those listed below)',                    'Federal' ),
    ( '56 - Military Reservation / Corps of Engineers',                      'Federal' ),
    ( '56--56 - Military Reservation / Corps of Engineers',                  'Federal' ),
    ( '53 - National Park Service',                                          'Federal' ),

    ( '20 - State - Other',                                                  'State' ),
    ( '20--20 - State - Other',                                              'State' ),
    ( '22 - Alleghany State Park Authority',                                 'State' ),
    ( '25 - Capital District State Park Commission',                         'State' ),
    ( '2L - NYS Thruway Authority',                                          'State' ),
    ( 'NYSDOT',                                                              'State' ),
    ( '10--NYSDOT',                                                          'State' ),
    ( '2J - Niagara Frontier State Park Commission',                         'State' ),
    ( '2J--2J - Niagara Frontier State Park Commission',                     'State' ),
    ( '2C - NYS Dept of Environmental Conservation',                         'State' ),
    ( '2C--2C - NYS Dept of Environmental Conservation',                     'State' ),
    ( '2P - NYS Power Authority',                                            'State' ),
    ( '26 - Central NY State Park Commission',                               'State' ),
    ( '2F - Long Island State Parks And Recreation Commission',              'State' ),
    ( '2F--2F - Long Island State Parks And Recreation Commission',          'State' ),
    ( '2K - NYS Bridge Authority',                                           'State' ),
    ( '2A - Genesee State Parks and Recreation Commission',                  'State' ),
    ( '2A--2A - Genesee State Parks and Recreation Commission',              'State' ),
    ( '27 - City of NY State Park Commission',                               'State' ),

    ( '23 - Nassau County Bridge Authority',                                 'County' ),
    ( '30 - County',                                                         'County' ),
    ( '30--30 - County',                                                     'County' ),
    ( '2H - Monroe County Water Authority',                                  'County' ),
    ( '23 - Nassau County Bridge Authority',                                 'County' ),

    ( '42 - City',                                                           'Municipal' ),
    ( '42--42 - City',                                                       'Municipal' ),
    ( '41 - Village',                                                        'Municipal' ),
    ( '41--41 - Village',                                                    'Municipal' ),
    ( '40 - Town',                                                           'Municipal' ),
    ( '40--40 - Town',                                                       'Municipal' ),
    ( '43 - NYC Dept of Water Supply, Gas and Electric',                     'Municipal' ),

    ( '21 - Authority or Commission - Other',                                'Authority or Commission' ),
    ( '21--21 - Authority or Commission - Other',                            'Authority or Commission' ),
    ( '2N - Palisades Interstate Park Commission',                           'Authority or Commission' ),
    ( '2U - MTA Bridges and Tunnels (aka TBTA)',                             'Authority or Commission' ),
    ( '2T - Transit Authority',                                              'Authority or Commission' ),
    ( '2W - Port Authority of NY and NJ',                                    'Authority or Commission' ),
    ( '29 - Finger Lakes Parks and Recreation Commission',                   'Authority or Commission' ),
    ( '24 - Peace Bridge Authority (aka Buffalo And Ft. Erie Pub Br.Auth)',  'Authority or Commission' ),
    ( '2G - Metropolitan Transportation Authority',                          'Authority or Commission' ),
    ( '2M - Ogdensburg Bridge and Port Authority',                           'Authority or Commission' ),
    ( '2I - Niagara Falls Bridge Commission',                                'Authority or Commission' ),
    ( '2B - Interstate Bridge Commission',                                   'Authority or Commission' ),
    ( '2Q - Seaway International Bridge Authority',                          'Authority or Commission' ),
    ( '2S - Thousand Islands Bridge Authority',                              'Authority or Commission' ),

    ( '72 - Other',                                                          'Other' ),
    ( '72--72 - Other',                                                      'Other' ),
    ( '70 - Private - Industrial',                                           'Other' ),
    ( '70--70 - Private - Industrial',                                       'Other' ),
    ( '71 - Private - Utility',                                              'Other' ),
    ( '62 - Retired (use to be Conrail - converted to 60)',                  'Other' ),

    ( '60 - Railroad',                                                       'Railroad' ),
    ( '61 - Long Island Railroad',                                           'Railroad' )
  ON CONFLICT DO NOTHING
;