﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WitnessKingTides.Web.Prototype.Models
{
    public class TideTrackerInputModel
    {
        public string Email { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Description { get; set; }

        public decimal Latitude { get; set; }

        public decimal Longitude { get; set; }

        public HttpPostedFileBase Photo { get; set; }

        public string FlickrId { get; set; }
    }

}